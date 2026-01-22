"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // Calling statuses
        queued: "bg-status-neutral-muted text-muted-foreground",
        picked_up: "bg-status-info-muted text-status-info",
        not_answered: "bg-status-warning-muted text-status-warning",
        not_contactable: "bg-destructive/10 text-destructive",
        interested: "bg-status-success-muted text-status-success",
        not_interested: "bg-destructive/10 text-destructive",
        // Eligibility statuses
        eligible: "bg-status-success-muted text-status-success",
        ineligible: "bg-destructive/10 text-destructive",
        pending: "bg-status-neutral-muted text-muted-foreground",
        // Generic
        default: "bg-secondary text-secondary-foreground",
        success: "bg-status-success-muted text-status-success",
        warning: "bg-status-warning-muted text-status-warning",
        info: "bg-status-info-muted text-status-info",
        error: "bg-destructive/10 text-destructive",
        muted: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "text-[10px] px-1 py-0",
        default: "text-xs px-1.5 py-0.5",
        lg: "text-sm px-2 py-0.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode
}

function StatusBadge({ className, variant, size, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant, size, className }))} {...props}>
      {children}
    </span>
  )
}

// Helper to map calling status to badge variant
export function getCallingStatusVariant(status: string): StatusBadgeProps["variant"] {
  const mapping: Record<string, StatusBadgeProps["variant"]> = {
    queued: "queued",
    picked_up: "picked_up",
    not_answered: "not_answered",
    not_contactable: "not_contactable",
    interested: "interested",
    not_interested: "not_interested",
  }
  return mapping[status] || "default"
}

// Helper to map eligibility status to badge variant
export function getEligibilityStatusVariant(status: string): StatusBadgeProps["variant"] {
  const mapping: Record<string, StatusBadgeProps["variant"]> = {
    eligible: "eligible",
    ineligible: "ineligible",
    pending: "pending",
  }
  return mapping[status] || "default"
}

export { StatusBadge, statusBadgeVariants }
