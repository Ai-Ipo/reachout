import { TeamGrid } from "@/features/team/team-grid"

export default function TeamPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Team</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your team and view their assignments
                    </p>
                </div>
            </div>
            <TeamGrid />
        </div>
    )
}
