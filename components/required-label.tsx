import type React from "react"
import { Label } from "@/components/ui/label"

interface RequiredLabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}

export function RequiredLabel({ htmlFor, children, required = true }: RequiredLabelProps) {
  return (
    <div className="flex items-baseline gap-1">
      <Label htmlFor={htmlFor} className="font-medium">
        {children}
      </Label>
      {required && <span className="text-destructive">*</span>}
    </div>
  )
}
