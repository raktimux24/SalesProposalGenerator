"use client"

import React, { createContext, useContext, useState } from "react"

// Define the response data structure
export interface WebhookResponseData {
  success: boolean;
  message: string;
  webhookError?: any;
  localBackup?: {
    success: boolean;
    filename?: string;
  };
  fileData?: {
    fileName: string;
    fileExtension: string;
    mimeType: string;
    fileSize: number;
    fileUrl: string;
    fileContent?: string;
  };
  emailSent?: boolean;
  emailData?: {
    subject: string;
    body: string;
    to: string;
    from?: string;
    previewHtml?: string;
  };
  timestamp?: string;
}

// Define the context type
type ResponseContextType = {
  responseData: WebhookResponseData | null
  setResponseData: (data: WebhookResponseData) => void
  clearResponseData: () => void
}

// Create the context with default values
const ResponseContext = createContext<ResponseContextType>({
  responseData: null,
  setResponseData: () => {},
  clearResponseData: () => {}
})

// Provider component
export function ResponseProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [responseData, setResponseData] = useState<WebhookResponseData | null>(null)
  
  const clearResponseData = () => {
    setResponseData(null)
  }
  
  return (
    <ResponseContext.Provider
      value={{
        responseData,
        setResponseData,
        clearResponseData
      }}
    >
      {children}
    </ResponseContext.Provider>
  )
}

// Hook to use the context
export function useResponse() {
  return useContext(ResponseContext)
}
