"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RequiredLabel } from "@/components/required-label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useForm } from "@/contexts/form-context"

interface FormFieldProps {
  id: string
  formKey: string
  label: string
  placeholder?: string
  required?: boolean
  multiline?: boolean
  delay?: number
}

export function FormField({
  id,
  formKey,
  label,
  placeholder,
  required = true,
  multiline = false,
  delay = 0,
}: FormFieldProps) {
  const { formData, errors, touched, updateFormField, setFieldTouched } = useForm()
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const value = formData[formKey as keyof typeof formData] || ""
  const error = errors[formKey]
  const isTouched = touched[formKey]
  const isValid = isTouched && !error && value.trim() !== ""

  useEffect(() => {
    if (error && isTouched) {
      setShake(true)
      setTimeout(() => setShake(false), 600)
    }
  }, [error, isTouched])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    updateFormField(formKey as keyof typeof formData, e.target.value)
  }

  const handleBlur = () => {
    setFieldTouched(formKey as keyof typeof formData, true)
  }

  const inputVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  }

  const errorVariants = {
    initial: { opacity: 0, y: -10, height: 0 },
    animate: { opacity: 1, y: 0, height: "auto" },
    exit: { opacity: 0, y: -10, height: 0 },
  }

  const inputClasses = `transition-all duration-300 ${
    error && isTouched
      ? "input-error"
      : isValid
        ? "input-success"
        : "focus:ring-2 focus:ring-primary/20 focus:border-primary"
  } ${shake ? "animate-shake" : ""}`

  return (
    <motion.div
      className="grid gap-2"
      initial="initial"
      animate="animate"
      transition={{ delay: delay * 0.1 }}
      variants={inputVariants}
    >
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>

      <div className="relative">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={id}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`min-h-[100px] ${inputClasses}`}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id={id}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClasses}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        )}

        {isValid && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-2.5 top-0 h-full flex items-center justify-center"
          >
            <CheckCircle2 className="h-4 w-4 text-success" />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {error && isTouched && (
          <motion.div
            id={`${id}-error`}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={errorVariants}
            className="text-sm text-destructive flex items-start gap-1 overflow-hidden"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
