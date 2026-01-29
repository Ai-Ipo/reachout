"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export type UserRole = "admin" | "telemarketer"

export interface UserWithRole {
    id: string // Supabase profile ID
    clerk_id: string
    full_name: string | null
    email: string | null
    image_url: string | null
    role: UserRole
    isSuperAdmin: boolean
}

export async function getAllUsers(): Promise<UserWithRole[]> {
    try {
        const client = await clerkClient()
        const { data: users } = await client.users.getUserList({ limit: 100 })

        if (users.length === 0) {
            return []
        }

        // Get Supabase profiles to map clerk_id to profile.id
        const supabase = await createClient()
        const clerkIds = users.map(u => u.id)

        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, clerk_id")
            .in("clerk_id", clerkIds)

        // Create a map of clerk_id -> profile.id
        const profileMap = new Map(profiles?.map(p => [p.clerk_id, p.id]) || [])

        // Combine Clerk data with Supabase profile IDs
        const usersWithRoles: UserWithRole[] = users
            .filter(user => profileMap.has(user.id)) // Only include users with a profile
            .map(user => ({
                id: profileMap.get(user.id)!,
                clerk_id: user.id,
                full_name: user.fullName,
                email: user.primaryEmailAddress?.emailAddress || null,
                image_url: user.imageUrl,
                role: (user.publicMetadata?.role as UserRole) || "telemarketer",
                isSuperAdmin: user.publicMetadata?.superadmin === true,
            }))

        // Sort: superadmins first, then admins, then telemarketers
        usersWithRoles.sort((a, b) => {
            if (a.isSuperAdmin && !b.isSuperAdmin) return -1
            if (!a.isSuperAdmin && b.isSuperAdmin) return 1
            if (a.role === "admin" && b.role !== "admin") return -1
            if (a.role !== "admin" && b.role === "admin") return 1
            return 0
        })

        return usersWithRoles
    } catch (error) {
        console.error("Error fetching all users from Clerk:", error)
        return []
    }
}
