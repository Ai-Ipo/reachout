"use client"

import { useEffect, useState } from "react"
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
import { Phone, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"

interface AssignedCompany {
    id: string
    internal_id: string
    name: string
    city: { name: string } | null
    calling_status: string
    created_at: string
}

export function AssignmentList() {
    const [companies, setCompanies] = useState<AssignedCompany[]>([])
    const [loading, setLoading] = useState(true)
    const { getToken } = useAuth()

    useEffect(() => {
        async function fetchAssignments() {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // RLS ensures we only get assigned companies
            const { data, error } = await supabase
                .from("companies")
                .select(`
            id,
            internal_id,
            name,
            calling_status,
            city:cities(name)
        `)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching assignments:", error)
            } else {
                // @ts-ignore
                setCompanies(data || [])
            }
            setLoading(false)
        }

        fetchAssignments()
    }, [getToken])

    if (loading) return <Skeleton className="w-full h-[300px]" />

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Assignments ({companies.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.map(company => (
                            <TableRow key={company.id}>
                                <TableCell className="font-mono text-xs">{company.internal_id}</TableCell>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.city?.name}</TableCell>
                                <TableCell>
                                    <Badge variant={company.calling_status === 'queued' ? 'secondary' : 'default'}>
                                        {company.calling_status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button asChild size="sm" variant="outline">
                                        <Link href={`/telemarketer/companies/${company.id}`}>
                                            <Phone className="w-3 h-3 mr-2" />
                                            Call
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {companies.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                    You have no assigned companies.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
