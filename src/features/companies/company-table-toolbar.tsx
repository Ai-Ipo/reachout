"use client"

import { Table } from "@tanstack/react-table"
import { X, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/features/companies/company-data-table-view-options"

import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface CompanyTableToolbarProps<TData> {
    table: Table<TData>
    totalCount: number
    onAddCompany?: () => void
}

import {
    callingStatusLabels,
    eligibilityStatusLabels,
    whatsappStatusLabels,
    boardTypeLabels
} from "@/lib/schemas/company-schema"

const callingStatuses = Object.entries(callingStatusLabels).map(([value, label]) => ({
    value,
    label,
}))

const eligibilityStatuses = Object.entries(eligibilityStatusLabels).map(([value, label]) => ({
    value,
    label,
}))

const whatsappStatuses = Object.entries(whatsappStatusLabels).map(([value, label]) => ({
    value,
    label,
}))

const boardTypes = Object.entries(boardTypeLabels).map(([value, label]) => ({
    value,
    label,
}))

export function CompanyTableToolbar<TData>({
    table,
    totalCount,
    onAddCompany
}: CompanyTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0
    const [profiles, setProfiles] = useState<{ label: string, value: string }[]>([])

    // Fetch profiles for the "Assigned To" filter
    useEffect(() => {
        const fetchProfiles = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name')

            if (data) {
                const profileOptions = data.map(p => ({
                    label: p.full_name || p.email || 'Unknown',
                    value: p.id
                }))
                // Add "Unassigned" option
                setProfiles([
                    { label: "Unassigned", value: "unassigned" },
                    ...profileOptions
                ])
            }
        }
        fetchProfiles()
    }, [])

    return (
        <div className="flex items-center justify-between py-3 overflow-x-auto">
            <div className="flex flex-1 items-center space-x-2">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search companies..."
                        value={(table.getState().globalFilter as string) ?? ""}
                        onChange={(event) => table.setGlobalFilter(event.target.value)}
                        className="h-9 w-[200px] lg:w-[300px] pl-8 bg-background/50"
                    />
                </div>

                {table.getColumn("calling_status") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("calling_status")}
                        title="Status"
                        options={callingStatuses}
                    />
                )}

                {table.getColumn("assigned_to") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("assigned_to")}
                        title="Assigned To"
                        options={profiles}
                    />
                )}

                {table.getColumn("eligibility_status") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("eligibility_status")}
                        title="Eligibility"
                        options={eligibilityStatuses}
                    />
                )}

                {table.getColumn("board_type") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("board_type")}
                        title="Board"
                        options={boardTypes}
                    />
                )}

                {table.getColumn("whatsapp_status") && (
                    <DataTableFacetedFilter
                        column={table.getColumn("whatsapp_status")}
                        title="WhatsApp"
                        options={whatsappStatuses}
                    />
                )}

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2 hidden sm:inline-block">
                    {totalCount} companies
                </span>
                <DataTableViewOptions table={table} onAddCompany={onAddCompany} />
            </div>
        </div>
    )
}
