"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"

export type UserRole = "admin" | "telemarketer"

interface UserProfile {
    id: string
    email: string | null
    full_name: string | null
    role: UserRole
}

interface AuthContextType {
    profile: UserProfile | null
    isLoading: boolean
    isAdmin: boolean
    isTelemarketer: boolean
}

const AuthContext = createContext<AuthContextType>({
    profile: null,
    isLoading: true,
    isAdmin: false,
    isTelemarketer: false,
})

export function useProfile() {
    return useContext(AuthContext)
}

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const { isLoaded, isSignedIn, user } = useUser()
    const { getToken } = useAuth()
    const [profileSynced, setProfileSynced] = useState(false)

    // Get role from Clerk's public metadata (default to telemarketer)
    const role = (user?.publicMetadata?.role as UserRole) || "telemarketer"

    // Sync profile to Supabase on sign-in (for assignment purposes)
    useEffect(() => {
        async function syncProfile() {
            if (!isLoaded || !isSignedIn || !user || profileSynced) return

            try {
                const token = await getToken({ template: "supabase" })
                const supabase = createClient(token)

                // Check if profile exists
                const { data: existing } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("clerk_id", user.id)
                    .single()

                if (!existing) {
                    // Create profile in Supabase (for company assignment)
                    const { error } = await supabase
                        .from("profiles")
                        .insert({
                            clerk_id: user.id,
                            email: user.primaryEmailAddress?.emailAddress || null,
                            full_name: user.fullName || null,
                            role: role,
                            image_url: user.imageUrl || null,
                        })

                    if (error) {
                        console.error("Error creating profile in Supabase:", error)
                    } else {
                        console.log("Profile synced to Supabase")
                    }
                } else {
                    // Update existing profile with latest info from Clerk
                    const { error } = await supabase
                        .from("profiles")
                        .update({
                            email: user.primaryEmailAddress?.emailAddress || null,
                            full_name: user.fullName || null,
                            role: role,
                            image_url: user.imageUrl || null,
                        })
                        .eq("clerk_id", user.id)

                    if (error) {
                        console.error("Error updating profile in Supabase:", error)
                    }
                }

                setProfileSynced(true)
            } catch (error) {
                console.error("Error syncing profile:", error)
            }
        }

        syncProfile()
    }, [isLoaded, isSignedIn, user, getToken, profileSynced])

    const isLoading = !isLoaded

    const profile: UserProfile | null = isSignedIn && user ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || null,
        full_name: user.fullName || null,
        role,
    } : null

    const value: AuthContextType = {
        profile,
        isLoading,
        isAdmin: role === "admin",
        isTelemarketer: role === "telemarketer" || role === "admin",
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
