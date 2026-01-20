"use client"

import { useUser, useClerk } from "@clerk/nextjs"
import {
    ChevronsUpDown,
    LogOut,
    User,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function NavUser() {
    const { user, isLoaded } = useUser()
    const { signOut, openUserProfile } = useClerk()

    if (!isLoaded) {
        return (
            <div className="flex items-center gap-2 p-2">
                <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                <div className="flex flex-col gap-1">
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                    <div className="h-2 w-24 rounded bg-muted animate-pulse" />
                </div>
            </div>
        )
    }

    if (!user) return null

    // Helper to get initials
    const initials = user.firstName && user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`
        : user.firstName
            ? user.firstName.slice(0, 2).toUpperCase()
            : "ME"

    const primaryEmail = user.primaryEmailAddress?.emailAddress

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.fullName}</span>
                                <span className="truncate text-xs text-muted-foreground">{primaryEmail}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side="bottom"
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.imageUrl} alt={user.fullName || "User"} />
                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.fullName}</span>
                                    <span className="truncate text-xs">{primaryEmail}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => openUserProfile()}>
                                <User className="mr-2 h-4 w-4" />
                                Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ redirectUrl: `/dashboard/sign-in` })}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
