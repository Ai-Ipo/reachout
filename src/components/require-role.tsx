"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useProfile, UserRole } from "./auth-provider"
import { Loader2 } from "lucide-react"

interface RequireRoleProps {
    children: React.ReactNode
    role: UserRole | UserRole[]
    fallbackUrl?: string
}

/**
 * Wrap pages with this component to require a specific role
 * Redirects to fallbackUrl if user doesn't have the required role
 */
export function RequireRole({ children, role, fallbackUrl }: RequireRoleProps) {
    const { profile, isLoading } = useProfile()
    const router = useRouter()

    const requiredRoles = Array.isArray(role) ? role : [role]
    const hasRequiredRole = profile && requiredRoles.includes(profile.role)

    useEffect(() => {
        if (isLoading) return

        if (!profile) {
            // No profile means profile creation failed or user not authenticated properly
            console.log("No profile found, cannot access protected route")
            return
        }

        if (!hasRequiredRole) {
            // Redirect based on user's actual role
            const redirectUrl = fallbackUrl || (profile.role === "admin" ? "/" : "/telemarketer/start")
            console.log("User role", profile.role, "doesn't match required roles, redirecting to", redirectUrl)
            router.replace(redirectUrl)
        }
    }, [isLoading, profile, hasRequiredRole, router, fallbackUrl])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        )
    }

    if (!hasRequiredRole) {
        return (
            <div className="flex items-center justify-center h-full min-h-[200px]">
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        )
    }

    return <>{children}</>
}

/**
 * Convenience component for admin-only pages
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
    return (
        <RequireRole role="admin" fallbackUrl="/telemarketer/start">
            {children}
        </RequireRole>
    )
}

/**
 * Convenience component for telemarketer pages (both roles can access)
 */
export function RequireTelemarketer({ children }: { children: React.ReactNode }) {
    return (
        <RequireRole role={["admin", "telemarketer"]}>
            {children}
        </RequireRole>
    )
}
