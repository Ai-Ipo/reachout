"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const pageSize = 10
    const { getToken } = useAuth()

    useEffect(() => {
        async function fetchCompanies() {
            setLoading(true)
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
                // Assuming 'unassigned' means assigned_to is null
                query = query.is("assigned_to", null)
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching companies:", error)
            } else {
                // @ts-ignore - Supabase types join inference can be tricky
                setCompanies(data || [])
            }
            setLoading(false)
        }

        fetchCompanies()
    }, [getToken, page, initialCityId, statusFilter])

    const nextValid = companies.length === pageSize

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Company Database</CardTitle>
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
            </CardHeader>
            <CardContent>
                {loading ? (
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
            </CardContent>
        </Card>
    )
}
