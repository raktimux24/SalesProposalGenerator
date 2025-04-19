"use client"
import { FormSection } from "@/components/form-section"
import { FormField } from "@/components/form-field"

interface CompanyFormProps {
  delay?: number
}

export function CompanyForm({ delay = 0 }: CompanyFormProps) {
  return (
    <FormSection title="Company & Contact Information" colorClass="bg-section-company" delay={delay}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="company-name"
          formKey="companyName"
          label="Your Company Name"
          placeholder="Your Company Inc."
          required={true}
          delay={delay + 0.1}
        />

        <FormField
          id="sender-name"
          formKey="senderName"
          label="Sender's Name and Title"
          placeholder="Jane Smith, CEO"
          required={true}
          delay={delay + 0.2}
        />
      </div>

      <div className="mt-4">
        <FormField
          id="contact-details"
          formKey="contactDetails"
          label="Contact Details"
          placeholder="Email, phone number, etc."
          required={true}
          delay={delay + 0.3}
        />
      </div>
    </FormSection>
  )
}
