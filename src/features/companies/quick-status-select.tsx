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
import { StatusBadge, getCallingStatusVariant } from "@/components/ui/status-badge"
import { callingStatusLabels, type CallingStatus } from "@/lib/schemas/company-schema"
import { Check, Loader2 } from "lucide-react"

interface QuickStatusSelectProps {
    companyId: string
    currentStatus: CallingStatus
    onOptimisticUpdate?: (newStatus: CallingStatus) => void
}

export function QuickStatusSelect({ companyId, currentStatus, onOptimisticUpdate }: QuickStatusSelectProps) {
    const [updating, setUpdating] = useState(false)
    const [open, setOpen] = useState(false)
    const { getToken } = useAuth()

    async function handleStatusChange(newStatus: CallingStatus) {
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
                    calling_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", companyId)

            if (error) throw error

            toast.success(`Status → ${callingStatusLabels[newStatus]}`)
        } catch (error) {
            console.error("Error updating status:", error)
            toast.error("Failed to update status")
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
                        <StatusBadge variant={getCallingStatusVariant(currentStatus)} size="sm">
                            {callingStatusLabels[currentStatus] || currentStatus}
                        </StatusBadge>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40" onClick={(e) => e.stopPropagation()}>
                {Object.entries(callingStatusLabels).map(([value, label]) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => handleStatusChange(value as CallingStatus)}
                        className="flex items-center justify-between text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <StatusBadge variant={getCallingStatusVariant(value)} size="sm">
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
