"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { useProfile } from "@/components/auth-provider"
import { Loader2, Building2, MapPin } from "lucide-react"
import { CompanyDataTable } from "@/features/companies/company-data-table"
import type { Company } from "@/features/companies/company-data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface City {
    id: string
    name: string
    short_code: string
    count?: number
}

interface PendingAssignmentsProps {
    onEditCompany: (company: Company | null) => void
    refreshKey: number
}

// Admin view - shows all pending eligibility companies
export function PendingAssignments({ onEditCompany, refreshKey }: PendingAssignmentsProps) {
    const [selectedCity, setSelectedCity] = useState<string>("all")
    const { getToken } = useAuth()
    const { profile } = useProfile()

    const fetchCities = useCallback(async () => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        // Get cities with pending companies count
        const { data: companyData } = await supabase
            .from("companies")
            .select("city_id")
            .eq("eligibility_status", "pending")

        if (companyData && companyData.length > 0) {
            // Count companies per city
            const cityCounts = companyData.reduce<Record<string, number>>((acc, c) => {
                acc[c.city_id] = (acc[c.city_id] || 0) + 1
                return acc
            }, {})

            const cityIds = Object.keys(cityCounts)

            const { data: cityData } = await supabase
                .from("cities")
                .select("id, name, short_code")
                .in("id", cityIds)
                .order("name")

            if (cityData) {
                return cityData.map(c => ({
                    ...c,
                    count: cityCounts[c.id] || 0
                }))
            }
        }
        return []
    }, [getToken])

    const { data: cities = [], isLoading } = useSWR(
        profile ? ['pending-cities', refreshKey] : null,
        fetchCities,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const totalCount = cities.reduce((sum, c) => sum + (c.count || 0), 0)

    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-medium">No pending companies</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        All companies have been reviewed for eligibility
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* City Selector */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>City:</span>
                </div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            All Cities ({totalCount})
                        </SelectItem>
                        {cities.map(city => (
                            <SelectItem key={city.id} value={city.id}>
                                {city.name} ({city.count})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Company Table */}
            <CompanyDataTable
                cityId={selectedCity === "all" ? undefined : selectedCity}
                eligibilityStatus="pending"
                onEditCompany={onEditCompany}
                hideAddButton
                showCityColumn={selectedCity === "all"}
                refreshKey={refreshKey}
            />
        </>
    )
}

interface TelemarketerAssignmentsProps {
    onEditCompany: (company: Company | null) => void
    refreshKey: number
}

// Telemarketer view with tabs for Pending and Completed
export function TelemarketerAssignments({ onEditCompany, refreshKey }: TelemarketerAssignmentsProps) {
    const [selectedPendingCity, setSelectedPendingCity] = useState<string>("all")
    const [selectedCompletedCity, setSelectedCompletedCity] = useState<string>("all")
    const { getToken } = useAuth()
    const { profile } = useProfile()

    const fetchAssignmentData = useCallback(async () => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        if (!profile?.id) return null

        // Get Supabase profile ID
        const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("clerk_id", profile.id)
            .single()

        if (!profileData) {
            return null
        }

        let pendingCities: City[] = []
        let completedCities: City[] = []

        // Get pending companies with city counts
        const { data: pendingCompanies } = await supabase
            .from("companies")
            .select("city_id")
            .eq("assigned_to", profileData.id)
            .eq("eligibility_status", "eligible")

        if (pendingCompanies && pendingCompanies.length > 0) {
            const cityCounts = pendingCompanies.reduce<Record<string, number>>((acc, c) => {
                acc[c.city_id] = (acc[c.city_id] || 0) + 1
                return acc
            }, {})

            const cityIds = Object.keys(cityCounts)

            const { data: cityData } = await supabase
                .from("cities")
                .select("id, name, short_code")
                .in("id", cityIds)
                .order("name")

            if (cityData) {
                pendingCities = cityData.map(c => ({
                    ...c,
                    count: cityCounts[c.id] || 0
                }))
            }
        }

        // Get completed companies with city counts (terminal states)
        const { data: completedCompanies } = await supabase
            .from("companies")
            .select("city_id")
            .eq("assigned_to", profileData.id)
            .in("calling_status", ["interested", "not_interested", "not_contactable"])

        if (completedCompanies && completedCompanies.length > 0) {
            const cityCounts = completedCompanies.reduce<Record<string, number>>((acc, c) => {
                acc[c.city_id] = (acc[c.city_id] || 0) + 1
                return acc
            }, {})

            const cityIds = Object.keys(cityCounts)

            const { data: cityData } = await supabase
                .from("cities")
                .select("id, name, short_code")
                .in("id", cityIds)
                .order("name")

            if (cityData) {
                completedCities = cityData.map(c => ({
                    ...c,
                    count: cityCounts[c.id] || 0
                }))
            }
        }

        return {
            supabaseProfileId: profileData.id,
            pendingCities,
            completedCities
        }
    }, [getToken, profile?.id])

    const { data, isLoading } = useSWR(
        profile ? ['telemarketer-assignments', refreshKey] : null,
        fetchAssignmentData,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    const supabaseProfileId = data?.supabaseProfileId || null
    const pendingCities = data?.pendingCities || []
    const completedCities = data?.completedCities || []

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const pendingTotal = pendingCities.reduce((sum, c) => sum + (c.count || 0), 0)
    const completedTotal = completedCities.reduce((sum, c) => sum + (c.count || 0), 0)

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center h-[30vh] space-y-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    )

    const CitySelector = ({
        cities,
        selectedCity,
        onSelect,
        totalCount
    }: {
        cities: City[]
        selectedCity: string
        onSelect: (value: string) => void
        totalCount: number
    }) => (
        <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>City:</span>
            </div>
            <Select value={selectedCity} onValueChange={onSelect}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                        All Cities ({totalCount})
                    </SelectItem>
                    {cities.map(city => (
                        <SelectItem key={city.id} value={city.id}>
                            {city.name} ({city.count})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )

    return (
        <Tabs defaultValue="pending" className="w-full">
            <TabsList>
                <TabsTrigger value="pending">
                    Pending {pendingTotal > 0 && `(${pendingTotal})`}
                </TabsTrigger>
                <TabsTrigger value="completed">
                    Completed {completedTotal > 0 && `(${completedTotal})`}
                </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
                {pendingTotal === 0 ? (
                    <EmptyState message="No pending assignments" />
                ) : (
                    <>
                        <CitySelector
                            cities={pendingCities}
                            selectedCity={selectedPendingCity}
                            onSelect={setSelectedPendingCity}
                            totalCount={pendingTotal}
                        />
                        <CompanyDataTable
                            cityId={selectedPendingCity === "all" ? undefined : selectedPendingCity}
                            assignedTo={supabaseProfileId || undefined}
                            eligibilityStatus="eligible"
                            onEditCompany={onEditCompany}
                            hideAssignColumn
                            hideAddButton
                            showCityColumn={selectedPendingCity === "all"}
                            refreshKey={refreshKey}
                        />
                    </>
                )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
                {completedTotal === 0 ? (
                    <EmptyState message="No completed work yet" />
                ) : (
                    <>
                        <CitySelector
                            cities={completedCities}
                            selectedCity={selectedCompletedCity}
                            onSelect={setSelectedCompletedCity}
                            totalCount={completedTotal}
                        />
                        <CompanyDataTable
                            cityId={selectedCompletedCity === "all" ? undefined : selectedCompletedCity}
                            assignedTo={supabaseProfileId || undefined}
                            callingStatusIn={["interested", "not_interested", "not_contactable"]}
                            onEditCompany={onEditCompany}
                            hideAssignColumn
                            hideAddButton
                            showCityColumn={selectedCompletedCity === "all"}
                            refreshKey={refreshKey}
                        />
                    </>
                )}
            </TabsContent>
        </Tabs>
    )
}
