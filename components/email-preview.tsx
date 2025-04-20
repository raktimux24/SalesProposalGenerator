"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useResponse } from "@/contexts/response-context"

export function EmailPreview() {
  const { responseData, setResponseData } = useResponse()
  const [loading, setLoading] = useState(false)
  const emailSent = responseData?.emailSent || false
  const emailData = responseData?.emailData
  
  // Debug log to check if email data is being received
  console.log('Email Preview Component - Response Data:', responseData)
  console.log('Email Preview Component - Email Data:', emailData)
  
  // If we have a PDF but no email data, fetch it separately
  useEffect(() => {
    const fetchEmailData = async () => {
      if (responseData?.fileData && !responseData.emailData) {
        console.log('Email data missing but file data present - fetching email data')
        setLoading(true)
        try {
          // Use the same form data that was used to generate the PDF
          const formData = responseData.formData
          
          if (!formData) {
            console.error('No form data available to fetch email')
            setLoading(false)
            return
          }
          
          // Create a simple email example based on the form data
          const sampleEmailData = {
            subject: `Proposal for ${formData.clientCompany || 'your business'}`,
            body: `Dear ${formData.clientContact || 'Client'},\n\nPlease find attached our proposal for ${formData.serviceName || 'our services'}.\n\nBest regards,\n${formData.senderName || 'The Team'}`,
            to: formData.clientContact ? `${formData.clientContact} <client@example.com>` : 'client@example.com',
            from: formData.senderName ? `${formData.senderName} <noreply@yourcompany.com>` : 'Your Company <noreply@yourcompany.com>',
            previewHtml: `<p>Dear ${formData.clientContact || 'Client'},</p><p>Please find attached our proposal for ${formData.serviceName || 'our services'}.</p><p>Best regards,<br/>${formData.senderName || 'The Team'}</p>`
          }
          
          // Update the response data with the email data
          setResponseData({
            ...responseData,
            emailData: sampleEmailData
          })
        } catch (error) {
          console.error('Error fetching email data:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchEmailData()
  }, [responseData, setResponseData])
  
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
              
              <div className="border rounded-md bg-white p-4">
                <div className="mb-4 text-sm">
                  {emailData.previewHtml ? (
                    <div dangerouslySetInnerHTML={createMarkup(emailData.previewHtml)} />
                  ) : (
                    <div className="whitespace-pre-line">{emailData.body || 'No email body content'}</div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="text-xs text-gray-500">
                    <p>This email includes a PDF attachment of your proposal.</p>
                  </div>
                </div>
              </div>
            </>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="max-w-xs mx-auto mt-2">
                {responseData ? 
                  'The webhook did not return any email data. Please check your webhook configuration.' : 
                  'No email data available yet. Submit a proposal to see the email preview.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}