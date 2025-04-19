"use client"
import { FormSection } from "@/components/form-section"
import { FormField } from "@/components/form-field"

interface SolutionFormProps {
  delay?: number
}

export function SolutionForm({ delay = 0 }: SolutionFormProps) {
  return (
    <FormSection title="Proposed Solution" colorClass="bg-section-solution" delay={delay}>
      <div className="grid gap-4">
        <FormField
          id="service-name"
          formKey="serviceName"
          label="Service/Project Name"
          placeholder="Website Redesign, Marketing Strategy, etc."
          required={true}
          delay={delay + 0.1}
        />

        <FormField
          id="solution-overview"
          formKey="solutionOverview"
          label="Solution Overview"
          placeholder="Describe your proposed solution in detail..."
          required={true}
          multiline={true}
          delay={delay + 0.2}
        />

        <FormField
          id="key-deliverable"
          formKey="keyDeliverable"
          label="Key Deliverable/Outcome"
          placeholder="What will the client receive or achieve?"
          required={true}
          multiline={true}
          delay={delay + 0.3}
        />
      </div>
    </FormSection>
  )
}
