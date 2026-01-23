"use client"

import * as React from "react"
import { Users, Trash2, X, Check } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { AnimatePresence, motion } from "framer-motion"

interface Profile {
    id: string
    full_name: string | null
    email: string | null
}

interface BulkActionBarProps {
    selectedCount: number
    onClearSelection: () => void
    onAssign: () => void
    onDelete: () => void
}

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    onAssign,
    onDelete,
}: BulkActionBarProps) {
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-background text-foreground px-3 py-2 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border"
                >
                    <div className="flex items-center gap-2 mr-2 pr-3 border-r border-border/60">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                            {selectedCount}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">Selected</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAssign}
                        className="h-7 px-2 text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        Assign
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                    </Button>

                    <div className="w-px h-4 bg-border/60 mx-1" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClearSelection}
                        className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

interface BulkAssignDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSuccess: () => void
}

export function BulkAssignDialog({
    open,
    onOpenChange,
    selectedIds,
    onSuccess,
}: BulkAssignDialogProps) {
    const [loading, setLoading] = React.useState(false)
    const [telemarketerId, setTelemarketerId] = React.useState<string>("")
    const [profiles, setProfiles] = React.useState<Profile[]>([])

    // Fetch telemarketer profiles on mount
    React.useEffect(() => {
        async function fetchProfiles() {
            const supabase = createClient()
            const { data } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .eq("role", "telemarketer")
                .order("full_name")

            if (data) setProfiles(data)
        }
        fetchProfiles()
    }, [])

    const handleAssign = async () => {
        if (!telemarketerId) return
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("companies")
                .update({ assigned_to: telemarketerId })
                .in("id", selectedIds)

            if (error) throw error

            toast.success(`Assigned ${selectedIds.length} companies`)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Failed to assign companies")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Companies</DialogTitle>
                    <DialogDescription>
                        Assign {selectedIds.length} selected companies to a team member.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="telemarketer">Team Member</Label>
                        <Select value={telemarketerId} onValueChange={setTelemarketerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map((profile) => {
                                    const initials = profile.full_name
                                        ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                        : profile.email?.[0]?.toUpperCase() || "?"
                                    return (
                                        <SelectItem key={profile.id} value={profile.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[10px] font-medium text-violet-600">{initials}</span>
                                                </div>
                                                <span>{profile.full_name || profile.email || "Unknown"}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!telemarketerId || loading}>
                        {loading ? "Assigning..." : "Assign"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface BulkDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSuccess: () => void
}

export function BulkDeleteDialog({
    open,
    onOpenChange,
    selectedIds,
    onSuccess,
}: BulkDeleteDialogProps) {
    const [loading, setLoading] = React.useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("companies")
                .delete()
                .in("id", selectedIds)

            if (error) throw error

            toast.success(`Deleted ${selectedIds.length} companies`)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Failed to delete companies")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete{" "}
                        <span className="font-bold text-foreground">{selectedIds.length}</span>{" "}
                        selected companies and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
