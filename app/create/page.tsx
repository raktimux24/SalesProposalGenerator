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
          // Include API key from environment if available (for non-browser environments)
          ...(process.env.NEXT_PUBLIC_API_KEY && {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY
          })
        },
        body: JSON.stringify(formData),
      })
      
      // Log the response status
      console.log("API response status:", response.status)
      
      // Parse the response JSON
      let responseData;
      try {
        responseData = await response.json()
        console.log("API response data:", responseData)
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error(`Error parsing server response: ${response.status}`)
      }
      
      // Check if the request was successful
      if (!response.ok) {
        const errorDetails = responseData.details || responseData.error || 'Unknown error';
        throw new Error(`Server error: ${response.status} - ${errorDetails}`)
      }
      
      // Handle different success scenarios
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
        // This shouldn't happen with our new API, but just in case
        throw new Error("Unknown error in proposal submission");
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
