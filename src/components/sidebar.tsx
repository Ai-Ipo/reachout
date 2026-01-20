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
    Phone
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


interface SidebarProps {
    className?: string
}

export function SidebarComponent({ className }: SidebarProps) {
    const pathname = usePathname()
    const activeBorderColor = '#8b5cf6'

    // Extract tenant from pathname (first segment)
    const tenant = pathname.split('/')[1] || 'tenant'

    const workspaceItems = [
        { href: `/`, label: "Home", icon: Home, disabled: false },
        { href: `/admin/cities`, label: "Cities", icon: MapPin, disabled: false },
        { href: `/admin/companies`, label: "All Companies", icon: Building2, disabled: false },
        { href: `/admin/team`, label: "Team", icon: Users, disabled: false },
        { href: `/telemarketer/start`, label: "My Assignments", icon: Phone, disabled: false },
    ]

    // Unified active path checker that handles both tenant and non-tenant routes
    const isActivePath = (href: string) => {
        return pathname === href
    }

    return (
        <Sidebar className={cn("w-64 max-h-[calc(100vh-2rem)] min-h-[calc(100vh-2rem)] border-none", className)}>
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
                            <SidebarMenu>
                                {workspaceItems.map((item) => {
                                    const Icon = item.icon
                                    const isItemActive = isActivePath(item.href)

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <div className="relative">
                                                <SidebarMenuButton
                                                    asChild={!item.disabled}
                                                    isActive={isItemActive && !item.disabled}
                                                    disabled={item.disabled}
                                                    className={cn(
                                                        "flex items-center w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300",
                                                        item.disabled
                                                            ? "text-muted-foreground cursor-not-allowed opacity-40"
                                                            : isItemActive
                                                                ? "bg-[var(--color-accent-primary-lighter)] dark:bg-[var(--color-accent-primary-dark)] text-[var(--color-accent-primary)] font-semibold shadow-sm"
                                                                : "text-sidebar-foreground/70 hover:bg-secondary/50 hover:text-foreground"
                                                    )}
                                                >
                                                    {item.disabled ? (
                                                        <div className="flex items-center gap-2 w-full">
                                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate">{item.label}</span>
                                                        </div>
                                                    ) : (
                                                        <Link href={item.href}>
                                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                                            <span className="truncate">{item.label}</span>
                                                        </Link>
                                                    )}
                                                </SidebarMenuButton>
                                            </div>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
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