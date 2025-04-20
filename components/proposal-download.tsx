"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileText, File } from 'lucide-react'
import { useResponse } from '@/contexts/response-context'
import { formatFileSize } from '@/lib/utils'

export function ProposalDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const { responseData } = useResponse()
  
  // Handle both success and error cases
  const fileData = responseData?.fileData
  
  // For demo/fallback purposes - if no fileData is available but we have a timestamp,
  // we can generate a fallback download URL
  const timestamp = responseData?.timestamp ? new Date(responseData.timestamp).toISOString().replace(/[:.]/g, '-') : new Date().toISOString().replace(/[:.]/g, '-')
  const fallbackFileUrl = `/downloads/${timestamp}-proposal.pdf`

  const handleDownload = () => {
    setIsDownloading(true)
    
    // Use fileData if available, otherwise use fallback URL
    const downloadUrl = fileData?.fileUrl || fallbackFileUrl
    const fileName = fileData?.fileName || 'proposal.pdf'
    
    if (!downloadUrl) {
      console.error('No file URL available')
      setIsDownloading(false)
      return
    }
    
    // For PDF files, we can either open in a new tab or download directly
    if ((fileData?.fileExtension === 'pdf' && fileData?.mimeType === 'application/pdf') || downloadUrl.endsWith('.pdf')) {
      // Option 1: Open PDF in a new tab
      window.open(downloadUrl, '_blank')
      
      // Option 2: Force download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // Handle other file types with direct download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    // Reset download state after a delay
    setTimeout(() => setIsDownloading(false), 2000)
  }

  return (
    <div className="h-full overflow-hidden border-none card-shadow rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 className="text-xl font-semibold leading-none tracking-tight">Your Proposal is Ready!</h3>
      </div>
      <div className="p-6 pt-0 space-y-6">
        <p className="text-muted-foreground">
          Thanks for using our Proposal Generator. Your customized proposal document has been created and is ready to
          download.
        </p>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full gap-2" 
            onClick={handleDownload} 
            disabled={isDownloading}
          >
            {isDownloading ? (
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
                Downloading...
              </>
            ) : (
              <>
                {fileData?.fileExtension === 'pdf' ? (
                  <span className="h-4 w-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <line x1="10" y1="9" x2="8" y2="9"/>
                    </svg>
                  </span>
                ) : (
                  <span className="h-4 w-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </span>
                )}
                {fileData?.fileExtension === 'pdf' ? 'View/Download PDF' : 'Download Proposal'}
              </>
            )}
          </button>
        </motion.div>
        
        {fileData?.fileUrl && fileData.fileExtension === 'pdf' && (
          <div className="mt-2 text-center">
            <a 
              href={fileData.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Open PDF in new tab
            </a>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {fileData ? (
            <>
              <div className="flex justify-between">
                <span>File Name:</span>
                <span className="truncate max-w-[150px]">{fileData.fileName}</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span>{fileData.fileExtension?.toUpperCase() || 'DOCX'}</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{formatFileSize(fileData.fileSize) || '245KB'}</span>
              </div>
              {fileData.mimeType && (
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="truncate max-w-[150px]">{fileData.mimeType}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Format:</span>
                <span>DOCX</span>
              </div>
              <div className="flex justify-between">
                <span>Size:</span>
                <span>245KB</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
