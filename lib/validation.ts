export type FieldError = string | null

export interface FormErrors {
  [key: string]: FieldError
}

export const validateField = (value: string, fieldName: string, required = true): FieldError => {
  if (required && !value.trim()) {
    return `${fieldName} is required`
  }

  // Email validation
  if (fieldName.toLowerCase().includes("email") && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address"
    }
  }

  return null
}

export const validateForm = (
  formData: Record<string, string>,
  fieldDefinitions: Record<string, { required: boolean; label: string }>,
): FormErrors => {
  const errors: FormErrors = {}

  Object.entries(fieldDefinitions).forEach(([fieldName, { required, label }]) => {
    const error = validateField(formData[fieldName] || "", label, required)
    if (error) {
      errors[fieldName] = error
    }
  })

  return errors
}
