"use client"

import { motion } from "framer-motion"
import { useResponse } from "@/contexts/response-context"

export function EmailPreview() {
  const { responseData } = useResponse()
  const emailSent = responseData?.emailSent || false
  const emailData = responseData?.emailData
  
  // Debug log to check if email data is being received
  console.log('Email Preview Component - Response Data:', responseData)
  console.log('Email Preview Component - Email Data:', emailData)
  
  // Function to render HTML content safely
  const createMarkup = (html: string) => {
    return { __html: html }
  }
  
  return (
    <div className="h-full overflow-hidden border-none card-shadow rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold leading-none tracking-tight">Email Preview</h3>
          {emailSent && (
            <div className="flex items-center text-green-600 text-sm">
              <span className="h-4 w-4 mr-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </span>
              <span>Email Sent</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 pt-0 font-mono text-sm">
        {!emailSent && emailData && (
          <div className="mb-4 relative w-full rounded-lg border border-amber-200 bg-amber-50 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-amber-600">
            <span className="absolute left-4 top-4 text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </span>
            <h5 className="mb-1 font-medium leading-none tracking-tight pl-7">Email Preview Only</h5>
            <div className="text-sm [&_p]:leading-relaxed pl-7">
              This is a preview of the email that would be sent when the proposal is submitted.
            </div>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {emailData && Object.keys(emailData).length > 0 ? (
            <>
              <div className="space-y-1 bg-gray-50 p-3 rounded-md">
                <div className="flex flex-col sm:flex-row">
                  <span className="w-20 font-medium">Subject:</span>
                  <span className="flex-1">{emailData.subject || 'No subject'}</span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-20 font-medium">From:</span>
                  <span className="flex-1">{emailData.from || 'Your Company <noreply@company.com>'}</span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="w-20 font-medium">To:</span>
                  <span className="flex-1">{emailData.to || 'Client'}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                {emailData.previewHtml ? (
                  <div 
                    className="email-body" 
                    dangerouslySetInnerHTML={createMarkup(emailData.previewHtml)}
                  />
                ) : (
                  <div className="whitespace-pre-line email-content prose prose-sm max-w-none p-4 bg-white rounded border border-gray-100 shadow-sm">
                    {emailData.body || 'No email body'}
                  </div>
                )}
              </div>
            </>
          ) : responseData && responseData.success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-amber-600">
              <span className="h-12 w-12 mb-4 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
              <h3 className="text-lg font-medium">Loading Email Data</h3>
              <p className="max-w-xs mt-2">
                Your proposal was submitted successfully. The email preview is being generated...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
              <span className="h-12 w-12 mb-4 inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </span>
              <h3 className="text-lg font-medium">Email Preview</h3>
              <p className="max-w-xs mt-2">
                Submit your proposal to generate an email preview.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
