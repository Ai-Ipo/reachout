"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

interface DeleteUserResult {
    success: boolean
    error?: string
    unassignedCount?: number
}

export async function deleteUser(clerkId: string): Promise<DeleteUserResult> {
    try {
        const client = await clerkClient()

        // Get the user to check if they're a superadmin
        const user = await client.users.getUser(clerkId)

        if (user.publicMetadata?.superadmin === true) {
            return {
                success: false,
                error: "Cannot delete a super admin",
            }
        }

        const supabase = await createClient()

        // Look up Supabase profile by clerk_id
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("clerk_id", clerkId)
            .single()

        if (profileError || !profile) {
            return {
                success: false,
                error: "User profile not found",
            }
        }

        // Unassign all companies assigned to this user
        const { data: unassigned } = await supabase
            .from("companies")
            .update({ assigned_to: null })
            .eq("assigned_to", profile.id)
            .select("id")

        const unassignedCount = unassigned?.length || 0

        // Delete the Supabase profile
        const { error: deleteError } = await supabase
            .from("profiles")
            .delete()
            .eq("clerk_id", clerkId)

        if (deleteError) {
            console.error("Error deleting Supabase profile:", deleteError)
            return {
                success: false,
                error: "Failed to delete user profile",
            }
        }

        // Delete the Clerk user
        await client.users.deleteUser(clerkId)

        return { success: true, unassignedCount }
    } catch (error) {
        console.error("Error deleting user:", error)
        return {
            success: false,
            error: "Failed to delete user",
        }
    }
}
