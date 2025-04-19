"use client"
import { FormSection } from "@/components/form-section"
import { FormField } from "@/components/form-field"

interface ClientDetailsFormProps {
  delay?: number
}

export function ClientDetailsForm({ delay = 0 }: ClientDetailsFormProps) {
  return (
    <FormSection title="Client Details" colorClass="bg-section-client" delay={delay}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="client-company"
          formKey="clientCompany"
          label="Client Company Name"
          placeholder="Acme Inc."
          required={true}
          delay={delay + 0.1}
        />

        <FormField
          id="client-contact"
          formKey="clientContact"
          label="Client Contact Person"
          placeholder="John Doe"
          required={true}
          delay={delay + 0.2}
        />
      </div>

      <div className="mt-4">
        <FormField
          id="client-industry"
          formKey="clientIndustry"
          label="Client Industry"
          placeholder="Technology, Healthcare, etc."
          required={false}
          delay={delay + 0.3}
        />
      </div>
    </FormSection>
  )
}
