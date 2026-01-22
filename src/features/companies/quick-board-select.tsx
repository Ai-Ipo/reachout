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
import { boardTypeLabels, type BoardType } from "@/lib/schemas/company-schema"
import { Check, Loader2 } from "lucide-react"


interface QuickBoardSelectProps {
    companyId: string
    currentType: BoardType | null | undefined
    onOptimisticUpdate?: (newType: BoardType) => void
}

import { StatusBadge, getBoardStatusVariant } from "@/components/ui/status-badge"

export function QuickBoardSelect({ companyId, currentType, onOptimisticUpdate }: QuickBoardSelectProps) {
    const [updating, setUpdating] = useState(false)
    const [open, setOpen] = useState(false)
    const { getToken } = useAuth()

    async function handleTypeChange(newType: BoardType) {
        if (newType === currentType) {
            setOpen(false)
            return
        }

        const previousType = currentType

        // Optimistic update
        onOptimisticUpdate?.(newType)
        setOpen(false)

        setUpdating(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { error } = await supabase
                .from("companies")
                .update({
                    board_type: newType,
                    updated_at: new Date().toISOString()
                })
                .eq("id", companyId)

            if (error) throw error

            toast.success(`Board → ${boardTypeLabels[newType]}`)
        } catch (error) {
            console.error("Error updating board type:", error)
            toast.error("Failed to update board type")
            if (previousType) onOptimisticUpdate?.(previousType)
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
                    ) : currentType ? (
                        <StatusBadge variant={getBoardStatusVariant(currentType)} size="sm">
                            {boardTypeLabels[currentType]}
                        </StatusBadge>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32" onClick={(e) => e.stopPropagation()}>
                {Object.entries(boardTypeLabels).map(([value, label]) => (
                    <DropdownMenuItem
                        key={value}
                        onClick={() => handleTypeChange(value as BoardType)}
                        className="flex items-center justify-between text-sm"
                    >
                        <StatusBadge variant={getBoardStatusVariant(value as BoardType)} size="sm">
                            {label}
                        </StatusBadge>
                        {value === currentType && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
