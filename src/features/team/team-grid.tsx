"use client"

import { useState } from "react"
import useSWR from "swr"
import { getTeamStats, type TelemarketerStats } from "@/app/actions/get-team-stats"
import { TelemarketerCard } from "./telemarketer-card"
import { TelemarketerDetailSheet } from "./telemarketer-detail-sheet"
import { Loader2, Users, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { useCallback } from "react"
import { MapPin } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function TeamGrid() {
    const { getToken } = useAuth()
    const [selectedCity, setSelectedCity] = useState<string>("all")

    const { data: telemarketers = [], isLoading, mutate } = useSWR(
        ['team-stats', selectedCity],
        ([_, cityId]) => getTeamStats(cityId),
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    const fetchCities = useCallback(async () => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)
        const { data } = await supabase
            .from("cities")
            .select("id, name, short_code")
            .order("name")
        return data || []
    }, [getToken])

    const { data: cities = [] } = useSWR(
        'cities',
        fetchCities,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    )
    const [selectedTelemarketer, setSelectedTelemarketer] = useState<TelemarketerStats | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    const handleViewAssignments = (telemarketer: TelemarketerStats) => {
        setSelectedTelemarketer(telemarketer)
        setSheetOpen(true)
    }

    const handleSheetClose = () => {
        setSheetOpen(false)
        // Refresh stats when sheet closes (in case assignments changed)
        mutate()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (telemarketers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-medium">No telemarketers yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Telemarketers will appear here once they sign in
                    </p>
                </div>
            </div>
        )
    }

    // Calculate totals
    const totalAssigned = telemarketers.reduce((sum, t) => sum + t.stats.total, 0)
    const totalInterested = telemarketers.reduce((sum, t) => sum + t.stats.interested, 0)
    const totalPending = telemarketers.reduce((sum, t) => sum + t.stats.queued, 0)

    return (
        <>
            {/* City Filter */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>Filter:</span>
                </div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            All Cities
                        </SelectItem>
                        {cities.map(city => (
                            <SelectItem key={city.id} value={city.id}>
                                {city.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-semibold mt-1">{telemarketers.length}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Total Assigned</p>
                    <p className="text-2xl font-semibold mt-1">{totalAssigned}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Interested</p>
                    <p className="text-2xl font-semibold mt-1 text-status-success">{totalInterested}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-2xl font-semibold mt-1 text-status-warning">{totalPending}</p>
                </div>
            </div>

            {/* Team grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {telemarketers.map((telemarketer) => (
                    <TelemarketerCard
                        key={telemarketer.id}
                        telemarketer={telemarketer}
                        onViewAssignments={handleViewAssignments}
                    />
                ))}
            </div>

            {/* Detail sheet */}
            <TelemarketerDetailSheet
                telemarketer={selectedTelemarketer}
                open={sheetOpen}
                onOpenChange={(open) => {
                    if (!open) handleSheetClose()
                    else setSheetOpen(open)
                }}
            />

            {/* Floating Legend */}
            <div className="fixed bottom-4 right-4 z-50">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full shadow-lg bg-background hover:bg-muted border-2"
                        >
                            <HelpCircle className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 mb-2" align="end" side="top">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">Status Legend</h4>
                            </div>
                            <div className="grid gap-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-muted" />
                                    <span className="text-xs text-muted-foreground">Pending (queued)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-status-info" />
                                    <span className="text-xs text-muted-foreground">In Progress (callback, etc)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-status-success" />
                                    <span className="text-xs text-muted-foreground">Interested</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-status-neutral" />
                                    <span className="text-xs text-muted-foreground">Not Interested</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                                    <span className="text-xs text-muted-foreground">Not Contactable</span>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </>
    )
}

