"use client"

import * as React from "react"
import { Users, Trash2, X, Phone, CheckCircle, MessageSquare, Building2 } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getTelemarketers, type Telemarketer } from "@/app/actions/get-telemarketers"
import {
    StatusBadge,
    getCallingStatusVariant,
    getEligibilityStatusVariant,
    getWhatsappStatusVariant,
    getBoardStatusVariant,
} from "@/components/ui/status-badge"
import {
    callingStatusLabels,
    eligibilityStatusLabels,
    whatsappStatusLabels,
    boardTypeLabels,
} from "@/lib/schemas/company-schema"

interface BulkActionBarProps {
    selectedCount: number
    onClearSelection: () => void
    onAssign: () => void
    onDelete: () => void
    onCallingStatus: () => void
    onEligibility: () => void
    onWhatsapp: () => void
    onBoardType: () => void
}

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    onAssign,
    onDelete,
    onCallingStatus,
    onEligibility,
    onWhatsapp,
    onBoardType,
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
                        onClick={onCallingStatus}
                        className="h-7 px-2 text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Call Status
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEligibility}
                        className="h-7 px-2 text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Eligibility
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onWhatsapp}
                        className="h-7 px-2 text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        WhatsApp
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBoardType}
                        className="h-7 px-2 text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                        Board
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
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
    const [profiles, setProfiles] = React.useState<Telemarketer[]>([])

    // Fetch telemarketer profiles from Clerk on mount
    React.useEffect(() => {
        async function fetchProfiles() {
            const data = await getTelemarketers()
            setProfiles(data)
        }
        fetchProfiles()
    }, [])

    const handleAssign = async () => {
        if (!telemarketerId) return
        setLoading(true)
        try {
            const supabase = createClient()

            const assignedTo = telemarketerId === "unassigned" ? null : telemarketerId

            const { error } = await supabase
                .from("companies")
                .update({ assigned_to: assignedTo })
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
                                <SelectItem value="unassigned" className="text-sm text-muted-foreground">
                                    Unassigned
                                </SelectItem>
                                {profiles.map((profile) => {
                                    const initials = profile.full_name
                                        ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                        : profile.email?.[0]?.toUpperCase() || "?"
                                    return (
                                        <SelectItem key={profile.id} value={profile.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5 flex-shrink-0 border border-border/50">
                                                    <AvatarImage src={profile.image_url || undefined} />
                                                    <AvatarFallback className="text-[10px] bg-muted text-foreground/70">{initials}</AvatarFallback>
                                                </Avatar>
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

// ── Generic Bulk Status Dialog ──────────────────────────────────────────

interface BulkStatusDialogProps<T extends string> {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSuccess: () => void
    title: string
    description: string
    field: string
    labels: Record<T, string>
    getVariant: (value: string) => any
}

function BulkStatusDialog<T extends string>({
    open,
    onOpenChange,
    selectedIds,
    onSuccess,
    title,
    description,
    field,
    labels,
    getVariant,
}: BulkStatusDialogProps<T>) {
    const [loading, setLoading] = React.useState(false)
    const [value, setValue] = React.useState<string>("")

    const handleUpdate = async () => {
        if (!value) return
        setLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from("companies")
                .update({ [field]: value })
                .in("id", selectedIds)

            if (error) throw error

            toast.success(`Updated ${selectedIds.length} companies`)
            onSuccess()
            onOpenChange(false)
            setValue("")
        } catch (error) {
            console.error(error)
            toast.error(`Failed to update ${field.replace("_", " ")}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setValue("") }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select value={value} onValueChange={setValue}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(labels).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                        <StatusBadge variant={getVariant(val)} size="sm" className="font-normal">
                                            {label as string}
                                        </StatusBadge>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { onOpenChange(false); setValue("") }}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={!value || loading}>
                        {loading ? "Updating..." : "Update"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ── Specific Bulk Dialogs ───────────────────────────────────────────────

interface BulkDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedIds: string[]
    onSuccess: () => void
}

export function BulkCallingStatusDialog(props: BulkDialogProps) {
    return (
        <BulkStatusDialog
            {...props}
            title="Update Calling Status"
            description={`Set calling status for ${props.selectedIds.length} selected companies.`}
            field="calling_status"
            labels={callingStatusLabels}
            getVariant={getCallingStatusVariant}
        />
    )
}

export function BulkEligibilityDialog(props: BulkDialogProps) {
    return (
        <BulkStatusDialog
            {...props}
            title="Update Eligibility"
            description={`Set eligibility status for ${props.selectedIds.length} selected companies.`}
            field="eligibility_status"
            labels={eligibilityStatusLabels}
            getVariant={getEligibilityStatusVariant}
        />
    )
}

export function BulkWhatsappDialog(props: BulkDialogProps) {
    return (
        <BulkStatusDialog
            {...props}
            title="Update WhatsApp Status"
            description={`Set WhatsApp status for ${props.selectedIds.length} selected companies.`}
            field="whatsapp_status"
            labels={whatsappStatusLabels}
            getVariant={getWhatsappStatusVariant}
        />
    )
}

export function BulkBoardTypeDialog(props: BulkDialogProps) {
    return (
        <BulkStatusDialog
            {...props}
            title="Update Board Type"
            description={`Set board type for ${props.selectedIds.length} selected companies.`}
            field="board_type"
            labels={boardTypeLabels}
            getVariant={getBoardStatusVariant}
        />
    )
}
