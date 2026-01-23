"use client"

import { useState } from "react"
import { PendingAssignments, TelemarketerAssignments } from "@/features/telemarketer/pending-assignments"
import { EditCompanyPanel } from "@/features/companies/edit-company-panel"
import type { Company } from "@/features/companies/company-data-table"
import { useProfile } from "@/components/auth-provider"
import { cn } from "@/lib/utils"

export default function TelemarketerStartPage() {
    const { isAdmin } = useProfile()
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    return (
        <div className="flex flex-row h-full">
            <div className={cn("flex-1 min-w-0 p-6 space-y-6", {
                "max-w-[calc(100vw-400px-12rem)]": editingCompany
            })}>
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

                {isAdmin ? (
                    <PendingAssignments
                        onEditCompany={setEditingCompany}
                        refreshKey={refreshKey}
                    />
                ) : (
                    <TelemarketerAssignments
                        onEditCompany={setEditingCompany}
                        refreshKey={refreshKey}
                    />
                )}
            </div>

            {editingCompany && (
                <div className="w-[400px] h-full border-l border-border bg-background shrink-0 animate-in slide-in-from-right duration-300">
                    <EditCompanyPanel
                        company={editingCompany}
                        onClose={() => setEditingCompany(null)}
                        onSuccess={() => {
                            setEditingCompany(null)
                            setRefreshKey(prev => prev + 1)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
