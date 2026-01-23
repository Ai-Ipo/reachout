"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { useProfile } from "@/components/auth-provider"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, Phone, Building2 } from "lucide-react"
import Link from "next/link"
import { StatusBadge, getCallingStatusVariant } from "@/components/ui/status-badge"

interface PendingCompany {
    id: string
    internal_id: string
    name: string
    city_id: string
    city: { id: string; name: string; short_code: string }[] | null
    calling_status: string
    eligibility_status: string
    assigned_to: string | null
}

interface CityInfo {
    id: string
    name: string
    short_code: string
}

interface GroupedCompanies {
    city: CityInfo
    companies: PendingCompany[]
}

export function PendingAssignments() {
    const [companies, setCompanies] = useState<PendingCompany[]>([])
    const [loading, setLoading] = useState(true)
    const { getToken } = useAuth()
    const { isAdmin, profile } = useProfile()

    useEffect(() => {
        async function fetchPendingCompanies() {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            let query = supabase
                .from("companies")
                .select(`
                    id,
                    internal_id,
                    name,
                    city_id,
                    calling_status,
                    eligibility_status,
                    assigned_to,
                    city:cities(id, name, short_code)
                `)
                .eq("eligibility_status", "pending")
                .order("created_at", { ascending: false })

            // Telemarketers only see their assigned companies
            if (!isAdmin && profile?.id) {
                // Get the Supabase profile ID from clerk_id
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("clerk_id", profile.id)
                    .single()

                if (profileData) {
                    query = query.eq("assigned_to", profileData.id)
                }
            }

            const { data, error } = await query

            if (error) {
                console.error("Error fetching pending companies:", error)
            } else {
                setCompanies((data as PendingCompany[]) || [])
            }
            setLoading(false)
        }

        if (profile) {
            fetchPendingCompanies()
        }
    }, [getToken, isAdmin, profile])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (companies.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-medium">No pending companies</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isAdmin
                            ? "All companies have been reviewed for eligibility"
                            : "You have no pending assignments"}
                    </p>
                </div>
            </div>
        )
    }

    // For admins, group by city
    if (isAdmin) {
        const grouped = companies.reduce<GroupedCompanies[]>((acc, company) => {
            // Supabase returns related data as array - get first element
            const cityInfo = Array.isArray(company.city) ? company.city[0] : company.city
            if (!cityInfo) return acc

            const existing = acc.find(g => g.city.id === cityInfo.id)
            if (existing) {
                existing.companies.push(company)
            } else {
                acc.push({
                    city: cityInfo,
                    companies: [company]
                })
            }
            return acc
        }, [])

        // Sort by city name
        grouped.sort((a, b) => a.city.name.localeCompare(b.city.name))

        return (
            <div className="space-y-8">
                {grouped.map(group => (
                    <div key={group.city.id}>
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-sm font-semibold text-foreground">
                                {group.city.name}
                            </h2>
                            <span className="text-xs text-muted-foreground">
                                ({group.companies.length})
                            </span>
                        </div>
                        <CompanyTable companies={group.companies} isAdmin={isAdmin} />
                    </div>
                ))}
            </div>
        )
    }

    // For telemarketers, show flat list
    return <CompanyTable companies={companies} isAdmin={isAdmin} />
}

function CompanyTable({ companies, isAdmin }: { companies: PendingCompany[], isAdmin: boolean }) {
    return (
        <div className="border border-border rounded-md overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-medium">ID</TableHead>
                        <TableHead className="text-xs font-medium">Company</TableHead>
                        {!isAdmin && <TableHead className="text-xs font-medium">City</TableHead>}
                        <TableHead className="text-xs font-medium">Call Status</TableHead>
                        <TableHead className="text-xs font-medium w-[100px]">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companies.map(company => (
                        <TableRow key={company.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {company.internal_id}
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                                {company.name}
                            </TableCell>
                            {!isAdmin && (
                                <TableCell className="text-sm text-muted-foreground">
                                    {company.city?.[0]?.name}
                                </TableCell>
                            )}
                            <TableCell>
                                <StatusBadge
                                    variant={getCallingStatusVariant(company.calling_status)}
                                >
                                    {company.calling_status?.replace(/_/g, " ") || "queued"}
                                </StatusBadge>
                            </TableCell>
                            <TableCell>
                                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                    <Link href={isAdmin ? `/admin/companies/${company.id}` : `/telemarketer/companies/${company.id}`}>
                                        <Phone className="w-3 h-3 mr-1.5" />
                                        Call
                                    </Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
