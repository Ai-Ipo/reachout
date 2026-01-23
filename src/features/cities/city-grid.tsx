"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Building2 } from "lucide-react"
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
    const [dialogOpen, setDialogOpen] = useState(false)
    const { getToken } = useAuth()

    const fetchCities = useCallback(async (): Promise<CityStats[]> => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

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
            throw error
        }

        return citiesData?.map((city: any) => ({
            id: city.id,
            name: city.name,
            short_code: city.short_code,
            total_companies: city.companies?.[0]?.count || 0,
            assigned_companies: 0
        })) || []
    }, [getToken])

    const { data: cities = [], isLoading, mutate } = useSWR<CityStats[]>(
        'city-grid',
        fetchCities,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    if (isLoading || !cities) {
        return <CityGridSkeleton />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">City Operations</h2>
                    <p className="text-muted-foreground">Manage lead generation campaigns by location</p>
                </div>
                <CityDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => mutate()} />

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

