"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Check, Loader2, UserCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Profile {
    id: string
    full_name: string | null
    email: string | null
}

interface QuickAssignSelectProps {
    companyId: string
    currentAssignment: Profile | null
    onOptimisticUpdate?: (profile: Profile | null) => void
}

export function QuickAssignSelect({ companyId, currentAssignment, onOptimisticUpdate }: QuickAssignSelectProps) {
    const [updating, setUpdating] = useState(false)
    const [open, setOpen] = useState(false)
    const [telemarketers, setTelemarketers] = useState<Profile[]>([])
    const [loadingProfiles, setLoadingProfiles] = useState(false)
    const { getToken } = useAuth()

    // Fetch telemarketers when dropdown opens
    useEffect(() => {
        if (open && telemarketers.length === 0) {
            fetchTelemarketers()
        }
    }, [open])

    async function fetchTelemarketers() {
        setLoadingProfiles(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { data, error } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .eq("role", "telemarketer")
                .order("full_name")

            if (error) throw error
            setTelemarketers(data || [])
        } catch (error) {
            console.error("Error fetching telemarketers:", error)
        } finally {
            setLoadingProfiles(false)
        }
    }

    async function handleAssign(profile: Profile | null) {
        if (profile?.id === currentAssignment?.id) {
            setOpen(false)
            return
        }

        const previousAssignment = currentAssignment

        // Optimistic update
        onOptimisticUpdate?.(profile)
        setOpen(false)

        setUpdating(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { error } = await supabase
                .from("companies")
                .update({
                    assigned_to: profile?.id || null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", companyId)

            if (error) throw error

            toast.success(profile ? `Assigned to ${profile.full_name || profile.email}` : "Unassigned")
        } catch (error) {
            console.error("Error updating assignment:", error)
            toast.error("Failed to update assignment")
            onOptimisticUpdate?.(previousAssignment)
        } finally {
            setUpdating(false)
        }
    }

    // Get initials for avatar
    function getInitials(name: string | null, email: string | null): string {
        if (name) {
            return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        }
        if (email) {
            return email[0].toUpperCase()
        }
        return "?"
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
                    ) : currentAssignment ? (
                        <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 max-w-full">
                            <div className="w-4 h-4 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-medium text-violet-700">
                                    {getInitials(currentAssignment.full_name, currentAssignment.email)}
                                </span>
                            </div>
                            <span className="text-[11px] font-medium truncate">
                                {currentAssignment.full_name || currentAssignment.email?.split("@")[0] || "Unknown"}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48" onClick={(e) => e.stopPropagation()}>
                {loadingProfiles ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {currentAssignment && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => handleAssign(null)}
                                    className="text-sm text-muted-foreground"
                                >
                                    <X className="w-3.5 h-3.5 mr-2" />
                                    Unassign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {telemarketers.length === 0 ? (
                            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                No telemarketers found
                            </div>
                        ) : (
                            telemarketers.map((profile) => (
                                <DropdownMenuItem
                                    key={profile.id}
                                    onClick={() => handleAssign(profile)}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[10px] font-medium text-violet-600">
                                                {getInitials(profile.full_name, profile.email)}
                                            </span>
                                        </div>
                                        <span className="text-sm truncate">
                                            {profile.full_name || profile.email?.split("@")[0] || "Unknown"}
                                        </span>
                                    </div>
                                    {profile.id === currentAssignment?.id && (
                                        <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            ))
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
