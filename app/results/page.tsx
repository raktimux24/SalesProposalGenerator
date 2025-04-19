"use client"

import Link from "next/link"
import { ArrowLeft, Plus, Check, AlertCircle, Download } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailPreview } from "@/components/email-preview"
import { ProposalDownload } from "@/components/proposal-download"
import { useResponse } from "@/contexts/response-context"

export default function ResultsPage() {
  const { responseData } = useResponse()
  return (
    <div className="relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blob-animation" />
      <div
        className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blob-animation"
        style={{ animationDelay: "-3.5s" }}
      />

      <div className="container relative z-10 max-w-[800px] py-8 md:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-3xl font-semibold md:text-4xl gradient-text"
        >
          Proposal Generated
        </motion.h1>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProposalDownload />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <EmailPreview />
          </motion.div>
        </div>
        
        {/* Webhook Response Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6"
        >
          <Card className="border-none card-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Submission Status</CardTitle>
            </CardHeader>
            <CardContent>
              {responseData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {responseData.success ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className={responseData.success ? "text-success font-medium" : "text-destructive font-medium"}>
                      {responseData.message}
                    </span>
                  </div>
                  
                  {responseData.webhookError && (
                    <div className="rounded-md bg-amber-50 p-4 text-sm">
                      <div className="font-medium text-amber-800">Webhook Information</div>
                      <div className="mt-1 text-amber-700">
                        The webhook delivery encountered an issue, but your data has been saved locally.
                      </div>
                      {responseData.localBackup?.success && responseData.localBackup.filename && (
                        <div className="mt-2 text-amber-700">
                          Backup file: {responseData.localBackup.filename}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {responseData.timestamp && (
                    <div className="text-sm text-muted-foreground">
                      Submitted: {new Date(responseData.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  No submission information available.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between"
        >
          <Button variant="outline" asChild className="gap-2 rounded-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild className="gap-2 rounded-full">
            <Link href="/create">
              <Plus className="h-4 w-4" />
              Create Another
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
