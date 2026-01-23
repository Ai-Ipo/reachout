"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        // Calling statuses
        queued: "bg-status-neutral-muted text-status-neutral ring-status-neutral/20",
        callback: "bg-status-info-muted text-status-info ring-status-info/20",
        not_answered: "bg-status-warning-muted text-status-warning-foreground ring-status-warning/20",
        not_contactable: "bg-destructive/10 text-destructive ring-destructive/20",
        interested: "bg-status-success-muted text-status-success ring-status-success/20",
        not_interested: "bg-destructive/10 text-destructive ring-destructive/20",

        // Eligibility statuses
        eligible: "bg-status-success-muted text-status-success ring-status-success/20",
        ineligible: "bg-destructive/10 text-destructive ring-destructive/20",
        pending: "bg-status-neutral-muted text-status-neutral ring-status-neutral/20",

        // Board types
        board_sme: "bg-primary/10 text-primary ring-primary/20",
        board_main: "bg-status-info-muted text-status-info ring-status-info/20",
        board_other: "bg-muted text-muted-foreground ring-border",

        // WhatsApp statuses
        wa_not_sent: "bg-status-neutral-muted text-status-neutral ring-status-neutral/20",
        wa_sent: "bg-status-info-muted text-status-info ring-status-info/20",
        wa_delivered: "bg-status-info-muted text-status-info ring-status-info/20",
        wa_read: "bg-status-success-muted text-status-success ring-status-success/20",
        wa_replied: "bg-status-success-muted text-status-success ring-status-success/20",
        wa_failed: "bg-destructive/10 text-destructive ring-destructive/20",

        // Generic
        default: "bg-status-neutral-muted text-status-neutral ring-status-neutral/20",
        success: "bg-status-success-muted text-status-success ring-status-success/20",
        warning: "bg-status-warning-muted text-status-warning-foreground ring-status-warning/20",
        info: "bg-status-info-muted text-status-info ring-status-info/20",
        error: "bg-destructive/10 text-destructive ring-destructive/20",
        muted: "bg-muted text-muted-foreground ring-border",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.5",
        default: "text-xs px-2 py-1",
        lg: "text-sm px-2.5 py-1",
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
    callback: "callback",
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

// Helper to map board type to badge variant
export function getBoardStatusVariant(status: string): StatusBadgeProps["variant"] {
  const mapping: Record<string, StatusBadgeProps["variant"]> = {
    SME: "board_sme",
    Main: "board_main",
    Other: "board_other",
  }
  return mapping[status] || "default"
}

// Helper to map whatsapp status to badge variant
export function getWhatsappStatusVariant(status: string): StatusBadgeProps["variant"] {
  const mapping: Record<string, StatusBadgeProps["variant"]> = {
    not_sent: "wa_not_sent",
    sent: "wa_sent",
    delivered: "wa_delivered",
    read: "wa_read",
    replied: "wa_replied",
    failed: "wa_failed",
  }
  return mapping[status] || "default"
}

export { StatusBadge, statusBadgeVariants }
