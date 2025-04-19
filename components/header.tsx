"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText } from "lucide-react"
import { motion } from "framer-motion"

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-white"
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <motion.div
            whileHover={{ rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center rounded-lg bg-primary p-1 text-primary-foreground"
          >
            <FileText className="h-5 w-5" />
          </motion.div>
          <span>Proposal Generator</span>
        </Link>
      </div>
    </header>
  )
}
