"use client"

import { PendingAssignments, TelemarketerAssignments } from "@/features/telemarketer/pending-assignments"
import { useProfile } from "@/components/auth-provider"

export default function TelemarketerStartPage() {
    const { isAdmin } = useProfile()

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isAdmin ? "Pending Eligibility Review" : "My Assignments"}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {isAdmin
                            ? "Companies pending eligibility determination across all cities"
                            : "Companies assigned to you for outreach"}
                    </p>
                </div>
            </div>

            {isAdmin ? <PendingAssignments /> : <TelemarketerAssignments />}
        </div>
    )
}
