"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Building2, Users } from "lucide-react"
import { CityDialog } from "./city-dialog"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CityGridSkeleton } from "./city-grid-skeleton"

interface CityStats {
    id: string
    name: string
    short_code: string
    total_companies: number
    assigned_companies: number
}

export function CityGrid() {
    const [cities, setCities] = useState<CityStats[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)

    const { getToken } = useAuth()

    async function fetchCities() {
        try {
            setLoading(true)
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // We need to fetch cities and aggregate company data. 
            // Since specific aggregate queries can be complex with basic RLS client, 
            // we'll fetch cities and then counts, or use a view if performance demands later.
            // For now, let's just list cities and assume we will implement the robust count 
            // via a view or separate query if needed. 
            // Actually, let's try a join with count for total companies at least.

            const { data: citiesData, error } = await supabase
                .from("cities")
                .select(`
          id, 
          name, 
          short_code,
          companies:companies(count)
        `)

            if (error) {
                console.error("Error fetching cities:", error)
                return
            }

            // For "assigned" count, we'd typically need another join or filtering.
            // For MVP V1 speed, let's fetch total companies count. 
            // If we really need "assigned", we might need a raw query or a view.
            // Let's stick to total companies for this first pass to ensure it works.

            const formattedCities = citiesData?.map((city: any) => ({
                id: city.id,
                name: city.name,
                short_code: city.short_code,
                total_companies: city.companies?.[0]?.count || 0,
                assigned_companies: 0 // Placeholder until we have a better way to fetch this efficiently
            })) || []

            setCities(formattedCities)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCities()
    }, [])

    if (loading) {
        return <CityGridSkeleton />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">City Operations</h2>
                    <p className="text-muted-foreground">Manage lead generation campaigns by location</p>
                </div>
                <CityDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchCities} />

            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cities.map((city) => (
                    <Link href={`/admin/cities/${city.id}`} key={city.id}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl font-bold">{city.name}</CardTitle>
                                <Badge variant="outline" className="font-mono">{city.short_code}</Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <Building2 className="mr-1 h-4 w-4 text-primary" />
                                        <span className="font-medium text-foreground">{city.total_companies}</span>
                                        <span className="ml-1">Companies</span>
                                    </div>
                                    {/* Placeholder for future assigned stats
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{city.assigned_companies} Assigned</span>
                  </div>
                  */}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {/* Empty State / Add New Card */}
                <div
                    onClick={() => setDialogOpen(true)}
                    className="flex h-full min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed hover:bg-muted/50 transition-colors"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">Add New City</p>
                </div>
            </div>

        </div>
    )
}

