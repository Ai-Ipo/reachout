"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge, getEligibilityStatusVariant } from "@/components/ui/status-badge"
import { eligibilityStatusLabels, type EligibilityStatus } from "@/lib/schemas/company-schema"
import { Check, Loader2 } from "lucide-react"

interface QuickEligibilitySelectProps {
    companyId: string
    currentStatus: EligibilityStatus
    onOptimisticUpdate?: (newStatus: EligibilityStatus) => void
}

export function QuickEligibilitySelect({ companyId, currentStatus, onOptimisticUpdate }: QuickEligibilitySelectProps) {
    const [updating, setUpdating] = useState(false)
    const [open, setOpen] = useState(false)
    const { getToken } = useAuth()

    async function handleStatusChange(newStatus: EligibilityStatus) {
        if (newStatus === currentStatus) {
            setOpen(false)
            return
        }

        const previousStatus = currentStatus

        // Optimistic update - update UI immediately
        onOptimisticUpdate?.(newStatus)
        setOpen(false)

        setUpdating(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { error } = await supabase
                .from("companies")
                .update({
                    eligibility_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", companyId)

            if (error) throw error

            toast.success(`Eligibility → ${eligibilityStatusLabels[newStatus]}`)
        } catch (error) {
            console.error("Error updating eligibility:", error)
            toast.error("Failed to update eligibility")
            // Revert on error
            onOptimisticUpdate?.(previousStatus)
        } finally {
            setUpdating(false)
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild disabled={updating}>
                <button
                    className="w-full h-full flex items-center -mx-2 px-2 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                >
                    {updating ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                        </span>
                    ) : (
                        <StatusBadge variant={getEligibilityStatusVariant(currentStatus)} size="sm">
                            {eligibilityStatusLabels[currentStatus] || currentStatus}
                        </StatusBadge>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36" onClick={(e) => e.stopPropagation()}>
                {Object.entries(eligibilityStatusLabels).map(([value, label]) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => handleStatusChange(value as EligibilityStatus)}
                        className="flex items-center justify-between text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <StatusBadge variant={getEligibilityStatusVariant(value)} size="sm">
                                {label}
                            </StatusBadge>
                        </div>
                        {value === currentStatus && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
