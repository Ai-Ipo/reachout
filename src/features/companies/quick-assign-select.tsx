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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Loader2, X } from "lucide-react"
import { getTelemarketers, type Telemarketer } from "@/app/actions/get-telemarketers"

interface QuickAssignSelectProps {
    companyId: string
    currentAssignment: {
        id: string
        full_name: string | null
        email: string | null
        image_url: string | null
    } | null
    onOptimisticUpdate?: (profile: Telemarketer | null) => void
}

export function QuickAssignSelect({ companyId, currentAssignment, onOptimisticUpdate }: QuickAssignSelectProps) {
    const [updating, setUpdating] = useState(false)
    const [open, setOpen] = useState(false)
    const [telemarketers, setTelemarketers] = useState<Telemarketer[]>([])
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
            const data = await getTelemarketers()
            setTelemarketers(data)
        } catch (error) {
            console.error("Error fetching telemarketers:", error)
        } finally {
            setLoadingProfiles(false)
        }
    }

    async function handleAssign(profile: Telemarketer | null) {
        if (profile?.id === currentAssignment?.id) {
            setOpen(false)
            return
        }

        const previousAssignment = currentAssignment as Telemarketer | null

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
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                        </span>
                    ) : currentAssignment ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-border bg-background hover:bg-muted/50 transition-colors max-w-full shadow-sm">
                            <Avatar className="w-4 h-4 flex-shrink-0 border border-border/50">
                                <AvatarImage src={currentAssignment.image_url || undefined} />
                                <AvatarFallback className="text-[8px] bg-muted text-foreground/70">
                                    {getInitials(currentAssignment.full_name, currentAssignment.email)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-medium truncate text-foreground/80">
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
                                        <Avatar className="w-5 h-5 flex-shrink-0 border border-border/50">
                                            <AvatarImage src={profile.image_url || undefined} />
                                            <AvatarFallback className="text-[10px] bg-muted text-foreground/70">
                                                {getInitials(profile.full_name, profile.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm truncate">
                                            {profile.full_name || profile.email?.split("@")[0] || "Unknown"}
                                        </span>
                                    </div>
                                    {profile.id === currentAssignment?.id && (
                                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
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
