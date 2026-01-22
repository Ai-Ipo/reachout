"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        // Calling statuses
        queued: "bg-gray-50 text-gray-600 ring-gray-500/10",
        picked_up: "bg-blue-50 text-blue-700 ring-blue-700/10",
        not_answered: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
        not_contactable: "bg-red-50 text-red-700 ring-red-600/10",
        interested: "bg-green-50 text-green-700 ring-green-600/20",
        not_interested: "bg-red-50 text-red-700 ring-red-600/10",

        // Eligibility statuses
        eligible: "bg-green-50 text-green-700 ring-green-600/20",
        ineligible: "bg-red-50 text-red-700 ring-red-600/10",
        pending: "bg-gray-50 text-gray-600 ring-gray-500/10",

        // Board types
        board_sme: "bg-purple-50 text-purple-700 ring-purple-700/10",
        board_main: "bg-indigo-50 text-indigo-700 ring-indigo-700/10",
        board_other: "bg-gray-100 text-gray-600 ring-gray-500/10",

        // WhatsApp statuses
        wa_not_sent: "bg-gray-50 text-gray-600 ring-gray-500/10",
        wa_sent: "bg-blue-50 text-blue-700 ring-blue-700/10",
        wa_delivered: "bg-cyan-50 text-cyan-700 ring-cyan-700/10",
        wa_read: "bg-emerald-50 text-emerald-700 ring-emerald-700/10",
        wa_replied: "bg-green-50 text-green-700 ring-green-600/20",
        wa_failed: "bg-red-50 text-red-700 ring-red-600/10",

        // Generic
        default: "bg-gray-50 text-gray-600 ring-gray-500/10",
        success: "bg-green-50 text-green-700 ring-green-600/20",
        warning: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
        info: "bg-blue-50 text-blue-700 ring-blue-700/10",
        error: "bg-red-50 text-red-700 ring-red-600/10",
        muted: "bg-gray-100 text-gray-600 ring-gray-500/10",
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
