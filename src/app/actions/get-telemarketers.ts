"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export interface Telemarketer {
    id: string // Supabase profile ID (for assigned_to)
    clerk_id: string
    full_name: string | null
    email: string | null
    image_url: string | null
}

export async function getTelemarketers(): Promise<Telemarketer[]> {
    try {
        const client = await clerkClient()
        const { data: users } = await client.users.getUserList({ limit: 100 })

        // Filter to telemarketers only (no role or role = telemarketer)
        const telemarketerUsers = users.filter(
            user => !user.publicMetadata?.role || user.publicMetadata?.role === "telemarketer"
        )

        if (telemarketerUsers.length === 0) {
            return []
        }

        // Get Supabase profiles to map clerk_id to profile.id
        const supabase = await createClient()
        const clerkIds = telemarketerUsers.map(u => u.id)

        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, clerk_id")
            .in("clerk_id", clerkIds)

        // Create a map of clerk_id -> profile.id
        const profileMap = new Map(profiles?.map(p => [p.clerk_id, p.id]) || [])

        // Combine Clerk data with Supabase profile IDs
        const telemarketers: Telemarketer[] = telemarketerUsers
            .filter(user => profileMap.has(user.id)) // Only include users with a profile
            .map(user => ({
                id: profileMap.get(user.id)!,
                clerk_id: user.id,
                full_name: user.fullName,
                email: user.primaryEmailAddress?.emailAddress || null,
                image_url: user.imageUrl,
            }))

        return telemarketers
    } catch (error) {
        console.error("Error fetching telemarketers from Clerk:", error)
        return []
    }
}
