import { UsersGrid } from "@/features/users/users-grid"

export default function UsersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage user roles and permissions
                    </p>
                </div>
            </div>
            <UsersGrid />
        </div>
    )
}
