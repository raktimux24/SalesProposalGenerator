"use client"

import Link from "next/link"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function ErrorPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-destructive/10 blob-animation" />
      <div
        className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-destructive/10 blob-animation"
        style={{ animationDelay: "-3.5s" }}
      />

      <div className="container relative z-10 max-w-md px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="mb-6 flex justify-center"
        >
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-4 text-2xl font-semibold md:text-3xl"
        >
          Something went wrong
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8 text-muted-foreground"
        >
          We couldn't connect to our servers. Please try again.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <Button variant="outline" asChild className="gap-2 rounded-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
          <Button asChild className="gap-2 rounded-full">
            <Link href="/create">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
