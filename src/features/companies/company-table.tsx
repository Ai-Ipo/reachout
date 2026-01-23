"use client"
import { useState, useCallback } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"

interface Company {
    id: string
    internal_id: string
    name: string
    city: { name: string } | null
    assigned_to_profile: { full_name: string } | null
    calling_status: string
    eligibility_status: string
    created_at: string
}

interface CompanyTableProps {
    initialCityId?: string
    statusFilter?: string // 'unassigned', 'active', etc.
}

export function CompanyTable({ initialCityId, statusFilter }: CompanyTableProps) {
    const [page, setPage] = useState(0)
    const pageSize = 10
    const { getToken } = useAuth()

    const fetchCompanies = useCallback(async () => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        const from = page * pageSize
        const to = from + pageSize - 1

        let query = supabase
            .from("companies")
            .select(`
            id,
            internal_id,
            name,
            calling_status,
            eligibility_status,
            created_at,
            city:cities(name),
            assigned_to_profile:profiles(full_name)
        `, { count: 'exact' })
            .range(from, to)
            .order("created_at", { ascending: false })

        if (initialCityId) {
            query = query.eq("city_id", initialCityId)
        }

        if (statusFilter === 'unassigned') {
            query = query.is("assigned_to", null)
        }

        const { data, error } = await query

        if (error) {
            console.error("Error fetching companies:", error)
            throw error
        }
        // Transform Supabase arrays to single objects
        return (data || []).map(company => ({
            ...company,
            city: Array.isArray(company.city) ? company.city[0] || null : company.city,
            assigned_to_profile: Array.isArray(company.assigned_to_profile)
                ? company.assigned_to_profile[0] || null
                : company.assigned_to_profile
        })) as Company[]
    }, [getToken, page, initialCityId, statusFilter])

    const { data: companies = [], isLoading } = useSWR<Company[]>(
        ['company-table', initialCityId, statusFilter, page],
        fetchCompanies,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    const nextValid = companies.length === pageSize

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Companies</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={!nextValid}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="w-full h-12" />
                    <Skeleton className="w-full h-12" />
                    <Skeleton className="w-full h-12" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Company Name</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No companies found. Upload data to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-mono text-xs">{company.internal_id || 'N/A'}</TableCell>
                                    <TableCell className="font-medium">{company.name}</TableCell>
                                    <TableCell>{company.city?.name || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            company.calling_status === 'interested' ? 'default' :
                                                company.calling_status === 'not_interested' ? 'destructive' : 'secondary'
                                        }>
                                            {company.calling_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {company.assigned_to_profile?.full_name || 'Unassigned'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}

