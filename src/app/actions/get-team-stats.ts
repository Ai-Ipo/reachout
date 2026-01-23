"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export interface TelemarketerStats {
    id: string // Supabase profile ID
    clerk_id: string
    full_name: string | null
    email: string | null
    image_url: string | null
    stats: {
        total: number
        queued: number
        picked_up: number
        not_answered: number
        not_contactable: number
        interested: number
        not_interested: number
    }
}

export async function getTeamStats(): Promise<TelemarketerStats[]> {
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

        const supabase = await createClient()
        const clerkIds = telemarketerUsers.map(u => u.id)

        // Get Supabase profiles to map clerk_id to profile.id
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, clerk_id")
            .in("clerk_id", clerkIds)

        if (!profiles || profiles.length === 0) {
            return []
        }

        // Create a map of clerk_id -> profile.id
        const profileMap = new Map(profiles.map(p => [p.clerk_id, p.id]))
        const profileIds = profiles.map(p => p.id)

        // Get company counts grouped by assigned_to and calling_status
        const { data: companyCounts } = await supabase
            .from("companies")
            .select("assigned_to, calling_status")
            .in("assigned_to", profileIds)

        // Build stats per telemarketer
        const statsMap = new Map<string, TelemarketerStats["stats"]>()

        // Initialize stats for all telemarketers
        profileIds.forEach(id => {
            statsMap.set(id, {
                total: 0,
                queued: 0,
                picked_up: 0,
                not_answered: 0,
                not_contactable: 0,
                interested: 0,
                not_interested: 0,
            })
        })

        // Count companies
        companyCounts?.forEach(company => {
            if (company.assigned_to) {
                const stats = statsMap.get(company.assigned_to)
                if (stats) {
                    stats.total++
                    const status = company.calling_status as keyof Omit<TelemarketerStats["stats"], "total">
                    if (status && stats[status] !== undefined) {
                        stats[status]++
                    }
                }
            }
        })

        // Combine Clerk data with stats
        const telemarketers: TelemarketerStats[] = telemarketerUsers
            .filter(user => profileMap.has(user.id))
            .map(user => ({
                id: profileMap.get(user.id)!,
                clerk_id: user.id,
                full_name: user.fullName,
                email: user.primaryEmailAddress?.emailAddress || null,
                image_url: user.imageUrl,
                stats: statsMap.get(profileMap.get(user.id)!) || {
                    total: 0,
                    queued: 0,
                    picked_up: 0,
                    not_answered: 0,
                    not_contactable: 0,
                    interested: 0,
                    not_interested: 0,
                },
            }))

        return telemarketers
    } catch (error) {
        console.error("Error fetching team stats:", error)
        return []
    }
}
