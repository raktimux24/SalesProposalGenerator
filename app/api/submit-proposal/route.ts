import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { z } from 'zod';

// Set up rate limiting
const RATE_LIMIT = 10; // Max requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in milliseconds
const ipRequests = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requestTimes = ipRequests.get(ip) || [];
  
  // Filter out requests older than the rate window
  const recentRequests = requestTimes.filter(time => time > now - RATE_WINDOW);
  
  // Update the requests for this IP
  ipRequests.set(ip, [...recentRequests, now]);
  
  // Check if the number of recent requests exceeds the limit
  return recentRequests.length < RATE_LIMIT;
}

// Define the response data structure with file information
interface WebhookResponseData {
  success: boolean;
  message: string;
  webhookError?: any;
  localBackup?: {
    success: boolean;
    filename?: string;
  };
  emailSent?: boolean;
  fileData?: {
    fileName: string;
    fileExtension: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
  };
  formData?: any; // Original form data for fallback generation
}

// Define the expected proposal data schema
const ProposalSchema = z.object({
  // Client Details
  clientCompany: z.string().min(1, "Client company name is required"),
  clientContact: z.string().min(1, "Client contact person is required"),
  clientIndustry: z.string().optional(),

  // Solution
  serviceName: z.string().min(1, "Service/Project name is required"),
  solutionOverview: z.string().min(1, "Solution overview is required"),
  keyDeliverable: z.string().min(1, "Key deliverable is required"),

  // Pricing
  pricingDetails: z.string().min(1, "Pricing details are required"),
  timeline: z.string().min(1, "Timeline is required"),

  // Company
  companyName: z.string().min(1, "Company name is required"),
  senderName: z.string().min(1, "Sender name is required"),
  contactDetails: z.string().min(1, "Contact details are required"),

  // Optional metadata
  _emailWebhookCall: z.boolean().optional(),
  _timestamp: z.string().optional()
});

type ProposalData = z.infer<typeof ProposalSchema>;

// Function to save proposal data locally as a fallback
async function saveProposalLocally(formData: ProposalData) {
  try {
    // Create a directory to store proposals if it doesn't exist
    // Use /tmp/local-proposals for serverless compatibility
    const proposalDir = path.join('/tmp', 'local-proposals');
    await fsPromises.mkdir(proposalDir, { recursive: true });
    
    // Generate a filename based on timestamp and company name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const companySlug = formData.companyName 
      ? formData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      : 'unknown-company';
    
    const filename = `proposal-${timestamp}-${companySlug}.json`;
    const filePath = path.join(proposalDir, filename);
    
    // Save the proposal data as JSON
    await fsPromises.writeFile(filePath, JSON.stringify(formData, null, 2));
    
    return {
      success: true,
      filename,
      path: filePath
    };
  } catch (error) {
    console.error('Error saving proposal locally:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: Request) {
  // Get client IP for rate limiting
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';
  
  // Check rate limit
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json({ 
      success: false, 
      message: 'Rate limit exceeded. Please try again later.' 
    }, { status: 429 });
  }
  
  // Check API key if provided in header
  const apiKey = request.headers.get('x-api-key');
  const configuredApiKey = process.env.API_KEY;
  
  if (configuredApiKey && apiKey !== configuredApiKey) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid API key' 
    }, { status: 401 });
  }
  
  // Check origin for CSRF protection
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');
  
  // In production, check that the request is coming from the same origin
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      `https://${host}`,
      `http://${host}`
    ].filter(Boolean);
    
    // If we have a referer or origin, check it against allowed origins
    if ((origin || referer) && !allowedOrigins.some(allowed => 
      origin === allowed || (referer && referer.startsWith(allowed as string))
    )) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid origin' 
      }, { status: 403 });
    }
  }
  
  try {
    // Parse the request body
    const formData = await request.json();
    
    // Validate the proposal data
    const result = ProposalSchema.safeParse(formData);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid proposal data', 
        errors: result.error.format() 
      }, { status: 400 });
    }
    
    const validatedData = result.data;
    
    // Initialize response data
    let fileData: WebhookResponseData['fileData'] | undefined;
    let webhookSuccess = false;
    let webhookError: any = null;
    let emailSent = false;
    let emailError: any = null;
    
    // Save locally as a fallback
    const localBackup = await saveProposalLocally(validatedData);
    
    try {
      // Get webhook URLs from environment variables
      const proposalWebhookUrl = process.env.PROPOSAL_WEBHOOK_URL;
      const emailWebhookUrl = process.env.EMAIL_WEBHOOK_URL;
      
      if (!proposalWebhookUrl && !emailWebhookUrl) {
        throw new Error('No webhook URLs configured');
      }
      
      // Prepare webhook requests
      const webhookRequests = [];
      
      // Add proposal webhook request if URL is configured
      if (proposalWebhookUrl) {
        webhookRequests.push(
          fetch(proposalWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedData),
          }).catch(error => {
            return { error };
          })
        );
      } else {
        webhookRequests.push(Promise.resolve(null));
      }
      
      // Add email webhook request if URL is configured
      if (emailWebhookUrl) {
        webhookRequests.push(
          fetch(emailWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(validatedData),
          }).catch(error => {
            return { error };
          })
        );
      } else {
        webhookRequests.push(Promise.resolve(null));
      }
      
      // Execute all webhook requests in parallel
      const results = await Promise.allSettled(webhookRequests);
      
      // Process proposal webhook result
      let proposalResponse = null;
      if (results[0].status === 'fulfilled') {
        proposalResponse = results[0].value;
        
        if (proposalResponse && !(proposalResponse instanceof Response)) {
          // It's an error object from our catch block
          throw new Error(proposalResponse.error?.message || 'Unknown webhook error');
        }
        
        if (proposalResponse && proposalResponse.ok) {
          webhookSuccess = true;
        } else if (proposalResponse) {
          // Get error details from the response
          const errorText = await proposalResponse.text();
          console.error('Proposal webhook error response:', errorText);
          
          try {
            const errorJson = JSON.parse(errorText);
            webhookError = {
              type: 'api',
              status: proposalResponse.status,
              message: errorJson.message || errorJson.error || 'Unknown API error',
              details: errorJson
            };
          } catch (e) {
            webhookError = {
              type: 'api',
              status: proposalResponse.status,
              message: errorText || 'Unknown API error'
            };
          }
        }
      } else if (results[0].status === 'rejected') {
        console.error('======= PROPOSAL WEBHOOK FAILED =======', results[0].reason);
      }
      
      // Process email webhook result
      if (results[1].status === 'fulfilled') {
        const emailResponse = results[1].value;
        
        if (emailResponse && !(emailResponse instanceof Response)) {
          // It's an error object from our catch block
          emailError = emailResponse.error?.message || 'Unknown email webhook error';
        } else if (emailResponse && emailResponse.ok) {
          emailSent = true;
        } else if (emailResponse) {
          // Get error details from the response
          const emailErrorText = await emailResponse.text();
          console.error('Email webhook error response:', emailErrorText);
          
          try {
            const errorJson = JSON.parse(emailErrorText);
            if (errorJson.code === 404 && errorJson.message && errorJson.message.includes('webhook')) {
              console.log('Email webhook needs activation. This is normal for test webhooks.');
            }
          } catch (e) {
            // If we can't parse the JSON, just log the error
            console.error('Could not parse email webhook error:', e);
          }
        }
      } else {
        console.error('======= EMAIL WEBHOOK FAILED =======', results[1].reason);
      }
      
      // Process the proposal response if successful
      if (webhookSuccess && proposalResponse) {
        // Check the content type to determine if it's a PDF or JSON
        const contentType = proposalResponse.headers.get('content-type') || '';
        
        if (contentType.includes('application/pdf')) {
          // Stream PDF back to client directly, without saving to disk
          const arrayBuffer = await proposalResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Get filename from content-disposition header or use default
          let fileName = 'proposal.pdf';
          const contentDisposition = proposalResponse.headers.get('content-disposition');
          if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/i);
            if (fileNameMatch && fileNameMatch[1]) {
              fileName = fileNameMatch[1];
            }
          }
          
          // Make sure it has a PDF extension
          if (!fileName.toLowerCase().endsWith('.pdf')) {
            fileName += '.pdf';
          }
          
          // In serverless environments, we can't write to public directory
          // Instead, save to /tmp (the only writable location) and encode file for response
          const fileDir = path.join('/tmp', 'downloads');
          await fsPromises.mkdir(fileDir, { recursive: true });
          
          // Generate a unique filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const savedFileName = `${timestamp}-${fileName}`;
          const filePath = path.join(fileDir, savedFileName);
          
          // Save the PDF file to /tmp as fallback/debugging
          await fsPromises.writeFile(filePath, buffer);
          console.log(`PDF saved to ${filePath} (temporary storage only)`); 
          
          // Instead of relying on file URLs (which won't work for /tmp),
          // we'll include the PDF as base64 data in the response
          const base64Data = buffer.toString('base64');
          
          // Create file data object
          fileData = {
            fileName: fileName,
            fileExtension: 'pdf',
            mimeType: 'application/pdf',
            fileSize: buffer.length,
            // For direct download, we'll use a data URI
            fileUrl: `data:application/pdf;base64,${base64Data}`
          };
        } else {
          console.log(`Received response with content-type: ${contentType}`);
        }
      }
    } catch (fetchError) {
      // Handle network errors (like CORS, timeout, etc.)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
      console.error('Webhook fetch error:', errorMessage);
      
      webhookError = {
        type: 'network',
        message: errorMessage
      };
      webhookSuccess = false;
    }
    
    // Return a response based on what happened
    const timestamp = new Date().toISOString();
    
    const responseData: WebhookResponseData = {
      success: webhookSuccess,
      message: webhookSuccess 
        ? 'Proposal processed successfully' 
        : 'Failed to process proposal',
      webhookError,
      localBackup: {
        success: localBackup.success,
        filename: localBackup.success ? localBackup.filename : undefined
      },
      emailSent,
      fileData,
      formData: validatedData // Include the original form data for fallback generation
    };
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Error processing proposal:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Server error processing proposal',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}