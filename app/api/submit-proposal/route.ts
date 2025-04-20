import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { z } from 'zod';

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number, last: number }>();
const RATE_LIMIT = 10; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute (60 seconds)

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, last: now };
  
  if (now - entry.last > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, last: now });
    return false; // Not rate limited
  }
  
  if (entry.count >= RATE_LIMIT) {
    return true; // Rate limited
  }
  
  entry.count += 1;
  entry.last = now;
  rateLimitMap.set(ip, entry);
  return false; // Not rate limited
}

// Define the response data structure with file information
export interface WebhookResponseData {
  success: boolean;
  message: string;
  webhookError?: any;
  localBackup?: {
    success: boolean;
    filename?: string;
  };
  timestamp?: string;
  emailSent?: boolean;
  fileData?: {
    fileName: string;
    fileExtension: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
  };
}

// Define the expected proposal data schema
const ProposalSchema = z.object({
  companyName: z.string().min(1).optional(),
  senderName: z.string().min(1).optional(),
  senderEmail: z.string().email().optional(),
  contactDetails: z.string().optional(),
  clientCompany: z.string().min(1).optional(),
  clientName: z.string().optional(),
  clientContact: z.string().optional(),
  clientIndustry: z.string().optional(),
  serviceName: z.string().min(1).optional(),
  solutionOverview: z.string().optional(),
  keyDeliverable: z.string().optional(),
  pricingDetails: z.string().optional(),
  timeline: z.string().optional()
});

type ProposalData = z.infer<typeof ProposalSchema>;

// Function to save proposal data locally as a fallback
async function saveProposalLocally(formData: ProposalData) {
  try {
    // Check if we're in a serverless environment (like Netlify)
    const isServerless = process.env.NETLIFY || process.env.VERCEL;
    
    // Skip file saving in serverless environments
    if (isServerless) {
      console.log('Skipping local file save in serverless environment');
      return { success: true, filename: 'serverless-mode' };
    }
    
    // Create a directory for storing proposals if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fsPromises.mkdir(dataDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, that's fine
    }
    
    // Generate a unique filename with timestamp and client name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const clientName = formData.clientCompany?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'unknown-client';
    const filename = `${timestamp}-${clientName}.json`;
    
    // Save the proposal data to a JSON file
    await fsPromises.writeFile(
      path.join(dataDir, filename),
      JSON.stringify(formData, null, 2)
    );
    
    console.log(`Proposal saved locally for client: ${clientName} at ${timestamp}`);
    return { success: true, filename };
  } catch (error) {
    console.error('Error saving proposal locally:', error instanceof Error ? error.message : 'Unknown error');
    // Don't fail the entire request just because we couldn't save locally
    return { success: false, filename: undefined };
  }
}

export async function POST(request: Request) {
  try {
    // 1. Rate limiting check
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // 2. API key authentication - allow same-origin requests or valid API key
    const apiKey = request.headers.get('x-api-key');
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';
    
    // Check if it's a same-origin request (from our own frontend)
    const isSameOrigin = 
      origin.includes('localhost') || 
      referer.includes('localhost') || 
      origin.includes(request.headers.get('host') || '');
      
    // If it's not a same-origin request, require API key
    if (!isSameOrigin && (!process.env.API_KEY || apiKey !== process.env.API_KEY)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // 3. Parse and validate the incoming request body
    let formData: ProposalData;
    try {
      const rawData = await request.json();
      formData = ProposalSchema.parse(rawData);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid input data' },
        { status: 400 }
      );
    }
    
    // 4. Log only non-sensitive metadata
    console.log(`Received proposal from: ${formData.clientCompany || 'Unknown client'} at ${new Date().toISOString()}`);
    
    // 5. Always save the proposal data locally first as a backup
    const localSaveResult = await saveProposalLocally(formData);
    
    // 6. Get webhook URLs from environment variables
    const proposalWebhookUrl = process.env.PROPOSAL_WEBHOOK_URL;
    const emailWebhookUrl = process.env.EMAIL_WEBHOOK_URL;
    
    // Log webhook configuration status
    if (!proposalWebhookUrl || !emailWebhookUrl) {
      console.warn('Missing webhook URL environment variables - will proceed with partial functionality');
    }
    
    // We'll continue even if webhooks are missing, but log the issue
    // This allows the API to work in environments where webhooks aren't configured
    
    // Remove the 'test' part from the URL to use the production webhook instead of test webhook
    // If you need to use test webhooks, you'll need to activate them before each use at:
    // https://proposalgenerator.app.n8n.cloud/
    
    // Forward the data to both n8n webhooks with timeout and error handling
    let proposalResponse = null;
    let emailResponse = null;
    let webhookSuccess = false;
    let webhookError = null;
    let fileData = null;
    let emailSent = false;
    let emailData = null;
    
    try {
      // Call both webhooks in parallel
      console.log('======= CALLING BOTH WEBHOOKS IN PARALLEL =======');
      
      // Create promises for both webhook calls, but only if URLs are defined
      const proposalPromise = proposalWebhookUrl ? fetch(proposalWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _proposalWebhookCall: true,
          _timestamp: new Date().toISOString()
        })
      }) : Promise.resolve(new Response(JSON.stringify({ success: false, message: 'Webhook URL not configured' }), { status: 200 }));
      
      const emailPromise = emailWebhookUrl ? fetch(emailWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _emailWebhookCall: true,
          _timestamp: new Date().toISOString()
        })
      }) : Promise.resolve(new Response(JSON.stringify({ success: false, message: 'Email webhook URL not configured' }), { status: 200 }));
      
      // Use Promise.allSettled to wait for both promises regardless of success/failure
      const results = await Promise.allSettled([
        proposalPromise,
        emailPromise
      ]);
      
      console.log('======= WEBHOOK RESULTS =======');
      
      // Handle proposal webhook result
      if (results[0].status === 'fulfilled') {
        proposalResponse = results[0].value;
        console.log('======= PROPOSAL WEBHOOK SUCCESSFUL =======');
        webhookSuccess = proposalResponse.ok;
        
        if (!proposalResponse.ok) {
          const responseText = await proposalResponse.text();
          console.error('Proposal webhook error:', proposalResponse.status, responseText);
          
          // Check if it's a 404 error (common with n8n test webhooks that need activation)
          let errorDetails = responseText;
          try {
            const errorJson = JSON.parse(responseText);
            if (errorJson.code === 404 && errorJson.message && errorJson.message.includes('webhook')) {
              errorDetails = 'The n8n webhook needs to be activated. Please contact the administrator.';
            }
          } catch (e) {
            // If we can't parse the JSON, just use the original error text
          }
          
          webhookError = {
            status: proposalResponse.status,
            details: errorDetails
          };
        }
      } else {
        console.error('======= PROPOSAL WEBHOOK FAILED =======', results[0].reason);
        webhookError = {
          type: 'network',
          message: results[0].reason instanceof Error ? results[0].reason.message : 'Unknown error'
        };
        webhookSuccess = false;
      }
      
      // Handle email webhook result
      if (results[1].status === 'fulfilled') {
        emailResponse = results[1].value;
        if (emailResponse.ok) {
          console.log('======= EMAIL WEBHOOK SUCCESSFUL =======');
          emailSent = true;
          
          try {
            // Parse the email response data
            const emailResponseData = await emailResponse.json();
            console.log('Email webhook response:', JSON.stringify(emailResponseData, null, 2));
            
            // Set emailSent to true since we got a response
            emailSent = true;
            
            // Check for different response formats
            if (Array.isArray(emailResponseData) && emailResponseData.length > 0) {
              // Handle the specific format from the example
              if (emailResponseData[0].output) {
                const emailText = emailResponseData[0].output;
                console.log('Email text from output:', emailText);
                
                // Extract subject, from, to from the email text using regex
                // Try multiple patterns for better matching
                const subjectPatterns = [
                  /\*Subject:\s*([^\n]*)\n/i,
                  /Subject:\s*([^\n]*)\n/i,
                  /Subject:\s*(.+?)(?=\nFrom:|$)/i
                ];
                
                const fromPatterns = [
                  /From:\s*([^\n]*)\n/i,
                  /From:\s*(.+?)(?=\nTo:|$)/i
                ];
                
                const toPatterns = [
                  /To:\s*([^\n]*)\n/i,
                  /To:\s*(.+?)(?=\n\n|$)/i
                ];
                
                // Try each pattern until we find a match
                let subjectMatch = null;
                for (const pattern of subjectPatterns) {
                  const match = emailText.match(pattern);
                  if (match) {
                    subjectMatch = match;
                    break;
                  }
                }
                
                let fromMatch = null;
                for (const pattern of fromPatterns) {
                  const match = emailText.match(pattern);
                  if (match) {
                    fromMatch = match;
                    break;
                  }
                }
                
                let toMatch = null;
                for (const pattern of toPatterns) {
                  const match = emailText.match(pattern);
                  if (match) {
                    toMatch = match;
                    break;
                  }
                }
                
                // Extract the body (everything after the headers)
                let body = emailText;
                // Extract the body - try different patterns
                let bodyStartIndex = -1;
                
                // Try to find where the actual email content starts
                const patterns = [
                  '*\n\nDear',
                  'To:*\n\nDear',
                  '\n\nDear',
                  'To:\s*[^\n]*\n\n',
                  '\n\nHello',
                  '\n\nHi',
                  '\n\nGreetings'
                ];
                
                for (const pattern of patterns) {
                  const regex = new RegExp(pattern, 'i');
                  const match = emailText.match(regex);
                  if (match && match.index !== undefined) {
                    bodyStartIndex = match.index + match[0].length - 4; // Adjust to keep 'Dear'
                    break;
                  }
                }
                
                if (bodyStartIndex !== -1) {
                  body = emailText.substring(bodyStartIndex);
                } else {
                  // Fallback: try to find the body after a double newline
                  const doubleNewlineIndex = emailText.indexOf('\n\n');
                  if (doubleNewlineIndex !== -1) {
                    body = emailText.substring(doubleNewlineIndex + 2);
                  } else {
                    // Last resort: just use everything after the first few lines
                    const lines = emailText.split('\n');
                    if (lines.length > 5) {
                      body = lines.slice(5).join('\n');
                    }
                  }
                }
                
                // Clean up the body text by removing any markdown or extra formatting
                body = body.replace(/\[Your Name\]/g, formData.senderName || 'Your Name');
                body = body.replace(/\[Your Title\]/g, formData.companyName ? `${formData.companyName} Representative` : 'Representative');
                body = body.replace(/\[Your Company\]/g, formData.companyName || 'Your Company');
                body = body.replace(/\[Your Phone Number\]/g, '');
                body = body.replace(/\[Your Email Address\]/g, '');
                body = body.replace(/\[Your Website \(optional\)\]/g, '');
                
                // Create a default subject if none was found
                const subject = subjectMatch ? subjectMatch[1].trim() : `Proposal for ${formData.clientName || 'Client'}`;
                const from = fromMatch ? fromMatch[1].trim() : (formData.senderName ? `${formData.senderName} <${formData.senderEmail || 'noreply@company.com'}>` : 'Your Company');
                const to = toMatch ? toMatch[1].trim() : (formData.clientContact || 'Client');
                
                // Log the extracted data for debugging
                console.log('Extracted email parts:', {
                  subject,
                  from,
                  to,
                  bodyPreview: body.substring(0, 100) + '...'
                });
                
                emailData = {
                  subject,
                  from,
                  to,
                  body,
                  previewHtml: ''
                };
              } else if (emailResponseData[0].json) {
                // Try to extract from json property if available
                const jsonData = emailResponseData[0].json;
                if (jsonData.subject || jsonData.body) {
                  emailData = {
                    subject: jsonData.subject || `Proposal for ${formData.clientName || 'Client'}`,
                    body: jsonData.body || 'Thank you for considering our proposal.',
                    to: jsonData.to || formData.clientContact || 'Client',
                    from: jsonData.from || (formData.senderName ? `${formData.senderName} <${formData.senderEmail || 'noreply@company.com'}>` : 'Your Company'),
                    previewHtml: jsonData.html || ''
                  };
                }
              }
            } else if (emailResponseData.emailData) {
              emailData = emailResponseData.emailData;
            } else if (emailResponseData.email) {
              // Alternative structure
              emailData = emailResponseData.email;
            } else if (emailResponseData.subject && emailResponseData.body) {
              // Direct email fields in response
              emailData = {
                subject: emailResponseData.subject,
                body: emailResponseData.body,
                to: emailResponseData.to || formData.clientContact || '',
                from: emailResponseData.from || (formData.senderName ? `${formData.senderName} <${formData.senderEmail || 'noreply@company.com'}>` : 'Your Company'),
                previewHtml: emailResponseData.previewHtml || emailResponseData.html || ''
              };
            } else {
              // Last resort - create a basic email from form data
              emailData = {
                subject: `Proposal for ${formData.clientName || 'Client'}`,
                body: `Dear ${formData.clientContact || 'Client'},\n\nThank you for considering our proposal. Please find the attached document for your review.\n\nBest regards,\n${formData.senderName || 'Your Name'}\n${formData.companyName || 'Your Company'}`,
                to: formData.clientContact || 'Client',
                from: formData.senderName ? `${formData.senderName} <${formData.senderEmail || 'noreply@company.com'}>` : 'Your Company',
                previewHtml: ''
              };
            }
            
            // Make sure we have email data even if extraction failed
            if (!emailData) {
              // Create a fallback email from form data
              emailData = {
                subject: `Proposal for ${formData.clientName || 'Client'}`,
                body: `Dear ${formData.clientContact || 'Client'},\n\nThank you for considering our proposal. Please find the attached document for your review.\n\nBest regards,\n${formData.senderName || 'Your Name'}\n${formData.companyName || 'Your Company'}`,
                to: formData.clientContact || 'Client',
                from: formData.senderName ? `${formData.senderName} <${formData.senderEmail || 'noreply@company.com'}>` : 'Your Company',
                previewHtml: ''
              };
            }
            
            console.log('Final email data:', emailData);
          } catch (error) {
            console.error('Failed to parse email response:', error);
          }
        } else {
          const emailErrorText = await emailResponse.text().catch(() => 'Could not read error response');
          console.error('======= EMAIL WEBHOOK RETURNED ERROR =======', emailResponse.status, emailErrorText);
          
          // Try to parse the error to provide a better message
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
          // It's a PDF file - handle it directly without conversion
          console.log('Received PDF file from webhook');
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
          
          // Save the PDF file to public directory for direct access
          const fileDir = path.join(process.cwd(), 'public', 'downloads');
          await fsPromises.mkdir(fileDir, { recursive: true });
          
          // Generate a unique filename
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const savedFileName = `${timestamp}-${fileName}`;
          const filePath = path.join(fileDir, savedFileName);
          
          // Save the PDF file as-is
          await fsPromises.writeFile(filePath, buffer);
          console.log(`PDF saved to ${filePath}`);
          
          // Create file data object
          fileData = {
            fileName: fileName,
            fileExtension: 'pdf',
            mimeType: 'application/pdf',
            fileSize: buffer.length,
            fileUrl: `/downloads/${savedFileName}`
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
    
    // We'll consider it a success if either the webhook worked OR we saved locally
    if (webhookSuccess) {
      // Ideal case: webhook worked
      return NextResponse.json({ 
        success: true, 
        message: 'Proposal submitted successfully',
        localBackup: localSaveResult.success,
        fileData: fileData, // Include file data if available
        emailSent: emailSent, // Include whether email was sent
        emailData: emailData, // Include email data if available
        timestamp: timestamp
      });
    } else if (localSaveResult.success) {
      // Fallback case: webhook failed but we saved locally
      // Check if it's a 404 error from n8n test webhook
      let errorMessage = 'Proposal saved locally. Webhook delivery failed, but your data is safe.';
      if (webhookError && webhookError.status === 404 && 
          typeof webhookError.details === 'string' && 
          (webhookError.details.includes('webhook') || webhookError.details.includes('n8n'))) {
        errorMessage = 'The n8n webhook needs to be activated. Your data has been saved locally.';
      }
      
      return NextResponse.json({ 
        success: true, 
        message: errorMessage,
        webhookError: webhookError,
        localBackup: {
          success: true,
          filename: localSaveResult.filename
        },
        // Include the original form data for fallback generation
        formData: formData,
        timestamp: new Date().toISOString()
      });
    } else {
      // Worst case: both webhook and local save failed
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to process proposal', 
          webhookError: webhookError,
          localSaveError: 'Failed to save proposal locally',
          timestamp: new Date().toISOString(),
          // Include the original form data for fallback generation
          formData: formData,
          message: 'Your proposal was received but there was an issue with processing. Please contact support if needed.'
        },
        { status: 200 } // Return 200 instead of 500 to allow frontend to handle gracefully
      );
    }
  } catch (error) {
    // Log and return any errors with more detail
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error processing proposal submission:', {
      message: errorMessage,
      stack: errorStack,
      error
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process proposal submission', 
        details: errorMessage,
        timestamp: new Date().toISOString(),
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 200 } // Return 200 to prevent generic error handling
    );
  }
}
