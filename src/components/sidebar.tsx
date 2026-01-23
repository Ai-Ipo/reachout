"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    FileText,
    FolderOpen,
    Box,
    ChevronDown,
    Eye,
    Book,
    MapPin,
    Building2,
    Users,
    Phone,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler"
import { NavUser } from "./nav-user"
import { useProfile } from "./auth-provider"


interface SidebarProps {
    className?: string
}

export function SidebarComponent({ className }: SidebarProps) {
    const pathname = usePathname()
    const { profile, isLoading, isAdmin, isTelemarketer } = useProfile()
    const activeBorderColor = '#8b5cf6'

    // Role-based navigation items
    const adminItems = [
        { href: `/`, label: "Home", icon: Home },
        { href: `/admin/team`, label: "Team", icon: Users },
        { href: `/telemarketer/start`, label: "Pending", icon: Phone },
    ]

    const telemarketerItems = [
        { href: `/telemarketer/start`, label: "My Assignments", icon: Phone },
    ]

    // Show appropriate items based on role
    const workspaceItems = isAdmin
        ? adminItems
        : telemarketerItems

    // Unified active path checker that handles both tenant and non-tenant routes
    const isActivePath = (href: string) => {
        return pathname === href
    }

    return (
        <Sidebar className={cn("w-48 max-h-[calc(100vh)] min-h-[calc(100vh)] border-none", className)}>
            <SidebarHeader className="p-6">
                {/* Header content if needed */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-extrabold tracking-tighter text-foreground uppercase">Ai IPO</h1>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-4">
                <div className="space-y-6">
                    {/* Workspace Navigation */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <SidebarMenu>
                                    {workspaceItems.map((item) => {
                                        const Icon = item.icon
                                        const isItemActive = isActivePath(item.href)

                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                <div className="relative">
                                                    <SidebarMenuButton
                                                        asChild
                                                        isActive={isItemActive}
                                                        className={cn(
                                                            "flex items-center w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300",
                                                            isItemActive
                                                                ? "bg-[var(--color-accent-primary-lighter)] dark:bg-[var(--color-accent-primary-dark)] text-[var(--color-accent-primary)] font-semibold shadow-sm"
                                                                : "text-sidebar-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                                                        )}
                                                    >
                                                        <Link href={item.href}>
                                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate">{item.label}</span>
                                                        </Link>
                                                    </SidebarMenuButton>
                                                </div>
                                            </SidebarMenuItem>
                                        )
                                    })}

                                </SidebarMenu>
                            )}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </div>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <AnimatedThemeToggler size="h-4" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}

// Default export for easier importing
export default SidebarComponent