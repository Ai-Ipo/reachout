"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateUserRole } from "@/app/actions/update-user-role"
import type { UserWithRole, UserRole } from "@/app/actions/get-all-users"

interface UserCardProps {
    user: UserWithRole
    onRoleUpdated: () => void
}

export function UserCard({ user, onRoleUpdated }: UserCardProps) {
    const [updating, setUpdating] = useState(false)
    const { full_name, email, image_url, role, isSuperAdmin } = user

    const initials = full_name
        ? full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : email?.[0]?.toUpperCase() || "?"

    const displayName = full_name || email?.split("@")[0] || "Unknown"

    async function handleRoleChange(newRole: UserRole) {
        if (newRole === role) return

        setUpdating(true)
        try {
            const result = await updateUserRole(user.clerk_id, newRole)

            if (result.success) {
                toast.success(`${displayName} is now ${newRole === "admin" ? "an admin" : "a telemarketer"}`)
                onRoleUpdated()
            } else {
                toast.error(result.error || "Failed to update role")
            }
        } catch (error) {
            console.error("Error updating role:", error)
            toast.error("Failed to update role")
        } finally {
            setUpdating(false)
        }
    }

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-10 h-10 border border-border/50">
                        <AvatarImage src={image_url || undefined} />
                        <AvatarFallback className="text-sm bg-muted text-foreground/70">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{displayName}</h3>
                            {isSuperAdmin && (
                                <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                </div>

                {/* Role Section */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Role</span>
                        {isSuperAdmin && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Super Admin
                            </Badge>
                        )}
                    </div>

                    {isSuperAdmin ? (
                        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30">
                            <span className="text-sm font-medium capitalize">{role}</span>
                        </div>
                    ) : (
                        <Select
                            value={role}
                            onValueChange={(value) => handleRoleChange(value as UserRole)}
                            disabled={updating}
                        >
                            <SelectTrigger className="w-full bg-background">
                                {updating ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        <span>Updating...</span>
                                    </div>
                                ) : (
                                    <SelectValue />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="telemarketer">Telemarketer</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
