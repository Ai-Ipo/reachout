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
import { whatsappStatusLabels, type WhatsappStatus } from "@/lib/schemas/company-schema"
import { Check, Loader2 } from "lucide-react"


interface QuickWhatsappSelectProps {
    companyId: string
    currentStatus: WhatsappStatus | null | undefined
    onOptimisticUpdate?: (newStatus: WhatsappStatus) => void
}

import { StatusBadge, getWhatsappStatusVariant } from "@/components/ui/status-badge"

export function QuickWhatsappSelect({ companyId, currentStatus, onOptimisticUpdate }: QuickWhatsappSelectProps) {
    const [updating, setUpdating] = useState(false)
    const [open, setOpen] = useState(false)
    const { getToken } = useAuth()

    async function handleStatusChange(newStatus: WhatsappStatus) {
        if (newStatus === currentStatus) {
            setOpen(false)
            return
        }

        const previousStatus = currentStatus

        // Optimistic update
        onOptimisticUpdate?.(newStatus)
        setOpen(false)

        setUpdating(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { error } = await supabase
                .from("companies")
                .update({
                    whatsapp_status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq("id", companyId)

            if (error) throw error

            toast.success(`WhatsApp → ${whatsappStatusLabels[newStatus]}`)
        } catch (error) {
            console.error("Error updating WhatsApp status:", error)
            toast.error("Failed to update WhatsApp status")
            if (previousStatus) onOptimisticUpdate?.(previousStatus)
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
                    ) : currentStatus ? (
                        <StatusBadge variant={getWhatsappStatusVariant(currentStatus)} size="sm">
                            {whatsappStatusLabels[currentStatus]}
                        </StatusBadge>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36" onClick={(e) => e.stopPropagation()}>
                {Object.entries(whatsappStatusLabels).map(([value, label]) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => handleStatusChange(value as WhatsappStatus)}
                        className="flex items-center justify-between text-sm"
                    >
                        <StatusBadge variant={getWhatsappStatusVariant(value as WhatsappStatus)} size="sm">
                            {label}
                        </StatusBadge>
                        {value === currentStatus && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
