"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Send, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ClientDetailsForm } from "@/components/client-details-form"
import { SolutionForm } from "@/components/solution-form"
import { PricingForm } from "@/components/pricing-form"
import { CompanyForm } from "@/components/company-form"
import { FormProvider, useForm } from "@/contexts/form-context"
import { useResponse } from "@/contexts/response-context"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

function ProposalForm() {
  const router = useRouter()
  const { formData, errors, isValid } = useForm()
  const { setResponseData } = useResponse()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      setFormError("Please fix the errors in the form before submitting.")
      topRef.current?.scrollIntoView({ behavior: "smooth" })

      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      })

      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      console.log("Preparing to send proposal data:", formData)
      
      // Send data to our API route instead of directly to the webhook
      const response = await fetch("/api/submit-proposal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "8f3b2d7e-4a1c-4c0a-9c0d-7f6e8e5a2b1c"
        },
        body: JSON.stringify(formData),
      })
      
      // Log the response status
      console.log("API response status:", response.status)
      
      // Check content type to determine if it's JSON or PDF
      const contentType = response.headers.get('content-type') || '';
      
      // Handle PDF responses (direct download)
      if (contentType.includes('application/pdf')) {
        console.log('Received PDF response from API');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Get filename from content-disposition header if available
        let filename = 'proposal.pdf';
        const disposition = response.headers.get('content-disposition');
        if (disposition) {
          const filenameMatch = disposition.match(/filename="(.+)"/i);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        
        // We need to make a separate API call to get the email data, since it's not in the PDF response
        console.log('Making additional API call to get email data');
        let emailData;
        let emailSent = false;
        
        try {
          // Call a special endpoint that returns only the email data without generating a new PDF
          const emailResponse = await fetch("/api/submit-proposal?emailOnly=true", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": "8f3b2d7e-4a1c-4c0a-9c0d-7f6e8e5a2b1c"
            },
            body: JSON.stringify(formData),
          });
          
          if (emailResponse.ok) {
            const emailResponseData = await emailResponse.json();
            emailData = emailResponseData.emailData;
            emailSent = emailResponseData.emailSent || false;
            console.log('Email data received:', emailData);
          }
        } catch (emailError) {
          console.error('Failed to fetch email data:', emailError);
        }
        
        // Create a complete response data object with both file and email data
        const responseData = {
          success: true,
          message: 'Proposal PDF generated successfully',
          fileData: {
            fileName: filename,
            fileUrl: url,
            mimeType: 'application/pdf'
          },
          emailData,
          emailSent,
          // Include the original form data so components can use it
          formData
        };
        
        // Store the response data and PDF URL
        setResponseData(responseData);
        
        toast({
          title: "Success",
          description: "Your proposal PDF has been generated successfully.",
        });
        
        // Navigate to processing page
        setTimeout(() => {
          router.push("/processing");
        }, 1000);
        
        return; // Exit early since we've handled the PDF response
      }
      
      // Handle JSON responses
      let responseData;
      try {
        responseData = await response.json()
        console.log("API response data:", responseData)
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error(`Error parsing server response: ${response.status}`)
      }
      
      // We now handle success and error cases based on the responseData.success flag
      // rather than the HTTP status code, since our API always returns 200 OK
      
      if (responseData.success) {
        // Successful submission
        let successMessage = "Your proposal data has been submitted successfully.";
        
        // If webhook failed but we have a local backup
        if (responseData.webhookError && responseData.localBackup?.success) {
          successMessage = "Your proposal has been saved locally. The webhook delivery failed, but your data is safe.";
        }
        
        console.log("Proposal submission successful:", responseData.message);
        
        // Store the response data in context for the results page
        setResponseData(responseData);
        
        toast({
          title: "Success",
          description: successMessage,
        });
        
        // Navigate to processing page after a short delay
        setTimeout(() => {
          router.push("/processing");
        }, 1000);
      } else {
        // Handle the error case where the API returned success: false
        // This is our new pattern - API returns 200 OK but with success: false and error details
        console.log("API returned error details:", responseData.error, responseData.message);
        
        // Store the response data anyway - we might want to show partial results
        setResponseData(responseData);
        
        // Show a toast with the error message from the API
        const errorMessage = responseData.message || responseData.error || "Unknown error occurred";
        
        toast({
          variant: "destructive",
          title: "Partial Success",
          description: errorMessage,
        });
        
        // Still navigate to processing, as we may have partial results
        setTimeout(() => {
          router.push("/processing");
        }, 1000);
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setIsSubmitting(false)
      
      // Handle the error properly with TypeScript type checking and provide more details
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else if (error !== null && typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          console.error('Could not stringify error object', e);
        }
      }
      
      setFormError(`An error occurred while submitting the form: ${errorMessage}`)

      toast({
        variant: "destructive",
        title: "Submission Error",
        description: `Failed to submit form: ${errorMessage}`,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      })
    }
  }

  return (
    <div className="container max-w-[720px] py-8 md:py-12">
      <div ref={topRef}>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-3xl font-semibold md:text-4xl gradient-text"
        >
          Create Your Proposal
        </motion.h1>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{formError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit}>
        <ClientDetailsForm delay={1} />
        <SolutionForm delay={2} />
        <PricingForm delay={3} />
        <CompanyForm delay={4} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex justify-end"
        >
          <Button
            type="submit"
            size="lg"
            className={`gap-2 rounded-full px-8 ${!isValid && !isSubmitting ? "opacity-70" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Generate Proposal
                <Send className="h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  )
}

export default function CreateProposalPage() {
  return (
    <FormProvider>
      <ProposalForm />
    </FormProvider>
  )
}
