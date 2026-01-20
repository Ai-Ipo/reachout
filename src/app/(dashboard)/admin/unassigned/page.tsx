"use client"

import { CompanyTable } from "@/features/companies/company-table"

export default function UnassignedCompaniesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Unassigned Companies</h2>
                <p className="text-muted-foreground">Companies waiting to be assigned to a telemarketer</p>
            </div>
            <CompanyTable statusFilter="unassigned" />
        </div>
    )
}
