"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"
import { CompanyDataTable } from "@/features/companies/company-data-table"
import { AddCompanyDialog } from "@/features/companies/add-company-dialog"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"

import { Skeleton } from "@/components/ui/skeleton"

export default function CityDetailPage() {
    const params = useParams()
    const cityId = params?.id as string
    const [city, setCity] = useState<any>(null)
    const [companyCount, setCompanyCount] = useState<number>(0)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const router = useRouter()
    const { getToken } = useAuth()

    const fetchCity = useCallback(async () => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        const { data } = await supabase
            .from("cities")
            .select("*")
            .eq("id", cityId)
            .single()

        if (data) {
            setCity(data)
        }

        // Fetch company count
        const { count } = await supabase
            .from("companies")
            .select("*", { count: "exact", head: true })
            .eq("city_id", cityId)

        setCompanyCount(count || 0)
    }, [cityId, getToken])

    useEffect(() => {
        if (cityId) fetchCity()
    }, [cityId, fetchCity, refreshKey])

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this city? This will fail if companies are attached.")) return

        const token = await getToken()
        const supabase = createClient(token)
        const { error } = await supabase.from("cities").delete().eq("id", cityId)

        if (!error) {
            router.push("/")
        } else {
            alert("Could not delete city. Check if it has companies assigned.")
        }
    }

    function handleCompanyAdded() {
        setRefreshKey(k => k + 1)
        fetchCity() // Update count
    }

    if (!city) return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-9 w-9 rounded-md" />
            </div>

            {/* Table Skeleton */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-9 w-[250px]" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-[100px]" />
                        <Skeleton className="h-9 w-[100px]" />
                        <Skeleton className="h-9 w-[100px]" />
                    </div>
                </div>
                <div className="rounded-md border">
                    <div className="h-12 border-b bg-muted/50 px-4" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border-b last:border-0">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-[150px]" />
                            <div className="ml-auto">
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            {city.name}
                            <span className="text-lg text-muted-foreground font-normal">({city.short_code})</span>
                        </h2>
                        <p className="text-sm text-muted-foreground">{companyCount} companies registered</p>
                    </div>
                </div>

                {/* 3-dot menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete City
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Company Table */}
            <CompanyDataTable
                key={refreshKey}
                cityId={cityId}
                onAddCompany={() => setAddDialogOpen(true)}
            />

            {/* Add Company Dialog */}
            <AddCompanyDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                cityId={cityId}
                onSuccess={handleCompanyAdded}
            />
        </div>
    )
}
