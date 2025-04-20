"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

export default function ProcessingPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 5;
        if (newProgress >= 100) {
          clearInterval(timer);
          // Schedule navigation outside of the state update function
          setTimeout(() => {
            router.push("/results");
          }, 0);
          return 100;
        }
        return newProgress;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [router])

  const circleVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden">
      {/* Full-page gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-purple-500/10 to-primary/5" />
      
      {/* Background blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blob-animation" />
      <div
        className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blob-animation"
        style={{ animationDelay: "-3.5s" }}
      />

      <div className="container relative z-10 max-w-md px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <motion.div
              variants={circleVariants}
              animate="animate"
              className="absolute -inset-4 rounded-full bg-primary/20"
            />
            <svg className="h-16 w-16 animate-spin text-primary" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 text-2xl font-semibold md:text-3xl"
        >
          <span className="gradient-text">Generating your proposal</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Progress value={progress} className="mb-4 h-2" />
          <p className="text-sm text-muted-foreground">{progress}% complete</p>
          <p className="mt-4 text-muted-foreground">This usually takes about 15-20 seconds.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex justify-center space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
              className="h-2 w-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
