"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { FormErrors } from "@/lib/validation"

export interface FormData {
  // Client Details
  clientCompany: string
  clientContact: string
  clientIndustry: string

  // Solution
  serviceName: string
  solutionOverview: string
  keyDeliverable: string

  // Pricing
  pricingDetails: string
  timeline: string

  // Company
  companyName: string
  senderName: string
  contactDetails: string
}

interface FormContextType {
  formData: FormData
  errors: FormErrors
  touched: Record<string, boolean>
  updateFormField: (field: keyof FormData, value: string) => void
  setFieldError: (field: keyof FormData, error: string | null) => void
  setFieldTouched: (field: keyof FormData, isTouched: boolean) => void
  validateField: (field: keyof FormData) => boolean
  resetForm: () => void
  isValid: boolean
}

const initialFormData: FormData = {
  clientCompany: "",
  clientContact: "",
  clientIndustry: "",
  serviceName: "",
  solutionOverview: "",
  keyDeliverable: "",
  pricingDetails: "",
  timeline: "",
  companyName: "",
  senderName: "",
  contactDetails: "",
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isValid, setIsValid] = useState(false)

  const fieldDefinitions: Record<keyof FormData, { required: boolean; label: string }> = {
    clientCompany: { required: true, label: "Client Company Name" },
    clientContact: { required: true, label: "Client Contact Person" },
    clientIndustry: { required: false, label: "Client Industry" },
    serviceName: { required: true, label: "Service/Project Name" },
    solutionOverview: { required: true, label: "Solution Overview" },
    keyDeliverable: { required: true, label: "Key Deliverable" },
    pricingDetails: { required: true, label: "Pricing Details" },
    timeline: { required: true, label: "Timeline" },
    companyName: { required: true, label: "Company Name" },
    senderName: { required: true, label: "Sender's Name and Title" },
    contactDetails: { required: true, label: "Contact Details" },
  }

  const updateFormField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    validateField(field)
  }

  const setFieldError = (field: keyof FormData, error: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
    updateFormValidity()
  }

  const setFieldTouched = (field: keyof FormData, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [field]: isTouched }))
    if (isTouched) {
      validateField(field)
    }
  }

  const validateField = (field: keyof FormData): boolean => {
    const { required, label } = fieldDefinitions[field]
    const value = formData[field]

    let error: string | null = null

    if (required && !value.trim()) {
      error = `${label} is required`
    }

    // Email validation for contact details
    if (field === "contactDetails" && value) {
      if (value.includes("@")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          error = "Please enter a valid email address"
        }
      }
    }

    setFieldError(field, error)
    return error === null
  }

  const updateFormValidity = () => {
    const requiredFields = Object.entries(fieldDefinitions)
      .filter(([_, { required }]) => required)
      .map(([field]) => field)

    const allRequiredFieldsFilled = requiredFields.every((field) => formData[field as keyof FormData].trim() !== "")
    const noErrors = Object.values(errors).every((error) => error === null)

    setIsValid(allRequiredFieldsFilled && noErrors)
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setErrors({})
    setTouched({})
    setIsValid(false)
  }

  return (
    <FormContext.Provider
      value={{
        formData,
        errors,
        touched,
        updateFormField,
        setFieldError,
        setFieldTouched,
        validateField,
        resetForm,
        isValid,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useForm() {
  const context = useContext(FormContext)
  if (context === undefined) {
    throw new Error("useForm must be used within a FormProvider")
  }
  return context
}
