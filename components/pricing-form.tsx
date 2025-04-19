"use client"
import { FormSection } from "@/components/form-section"
import { FormField } from "@/components/form-field"

interface PricingFormProps {
  delay?: number
}

export function PricingForm({ delay = 0 }: PricingFormProps) {
  return (
    <FormSection title="Pricing & Timeline" colorClass="bg-section-pricing" delay={delay}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="pricing-details"
          formKey="pricingDetails"
          label="Pricing Details"
          placeholder="$5,000 total, $150/hour, etc."
          required={true}
          delay={delay + 0.1}
        />

        <FormField
          id="timeline"
          formKey="timeline"
          label="Timeline/Schedule"
          placeholder="4 weeks, Q3 2023, etc."
          required={true}
          delay={delay + 0.2}
        />
      </div>
    </FormSection>
  )
}
