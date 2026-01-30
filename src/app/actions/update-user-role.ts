"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "./get-all-users"

interface UpdateRoleResult {
    success: boolean
    error?: string
}

export async function updateUserRole(
    clerkId: string,
    newRole: UserRole
): Promise<UpdateRoleResult> {
    try {
        const client = await clerkClient()

        // Get the user to check if they're a superadmin
        const user = await client.users.getUser(clerkId)

        if (user.publicMetadata?.superadmin === true) {
            return {
                success: false,
                error: "Cannot change role of a super admin",
            }
        }

        // Update Clerk publicMetadata
        await client.users.updateUserMetadata(clerkId, {
            publicMetadata: {
                ...user.publicMetadata,
                role: newRole,
            },
        })

        // Also update Supabase profiles for immediate RLS effect
        const supabase = await createClient()
        const { error: dbError } = await supabase
            .from("profiles")
            .update({ role: newRole })
            .eq("clerk_id", clerkId)

        if (dbError) {
            console.error("Error updating Supabase profile:", dbError)
            // Don't fail the whole operation - Clerk is the source of truth
            // Profile will sync on next login
        }

        return { success: true }
    } catch (error) {
        console.error("Error updating user role:", error)
        return {
            success: false,
            error: "Failed to update user role",
        }
    }
}
