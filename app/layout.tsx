import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/toaster"
import { ResponseProvider } from "@/contexts/response-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Proposal Generator App",
  description: "Create personalized SaaS/consulting proposals from a fixed template",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Book.svg" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ResponseProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ResponseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
