"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background blobs */}
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blob-animation" />
      <div
        className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-purple-500/10 blob-animation"
        style={{ animationDelay: "-3.5s" }}
      />

      <div className="container relative z-10 flex flex-col items-center justify-center gap-8 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[800px] space-y-4"
        >
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            <span className="gradient-text">Proposal Generator</span>
          </h1>
          <p className="text-xl text-muted-foreground md:text-2xl">
            Create personalized SaaS/consulting proposals in minutes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button asChild size="lg" className="gap-2 rounded-full px-8 text-lg">
            <Link href="/create">
              Create Proposal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3"
        >
          {[
            {
              title: "Fast & Efficient",
              description: "Generate professional proposals in minutes, not hours",
            },
            {
              title: "Customizable",
              description: "Tailor your proposals to match your client's specific needs",
            },
            {
              title: "Professional",
              description: "Create polished documents that win more business",
            },
          ].map((feature, index) => (
            <motion.div key={index} whileHover={{ y: -5 }} className="rounded-xl bg-white p-6 text-center shadow-sm">
              <h3 className="mb-2 text-lg font-medium">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
