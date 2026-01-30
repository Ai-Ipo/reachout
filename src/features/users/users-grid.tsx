"use client"

import useSWR from "swr"
import { getAllUsers } from "@/app/actions/get-all-users"
import { UserCard } from "./user-card"
import { Loader2, Users } from "lucide-react"

export function UsersGrid() {
    const { data: users = [], isLoading, mutate } = useSWR(
        'all-users',
        () => getAllUsers(),
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-medium">No users yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Users will appear here once they sign in
                    </p>
                </div>
            </div>
        )
    }

    // Calculate totals
    const totalAdmins = users.filter(u => u.role === "admin").length
    const totalTelemarketers = users.filter(u => u.role === "telemarketer").length

    return (
        <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-semibold mt-1">{users.length}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Admins</p>
                    <p className="text-2xl font-semibold mt-1">{totalAdmins}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Telemarketers</p>
                    <p className="text-2xl font-semibold mt-1">{totalTelemarketers}</p>
                </div>
            </div>

            {/* Users grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users.map((user) => (
                    <UserCard
                        key={user.id}
                        user={user}
                        onRoleUpdated={() => mutate()}
                    />
                ))}
            </div>
        </>
    )
}
