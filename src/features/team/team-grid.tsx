"use client"

import { useState, useEffect } from "react"
import { getTeamStats, type TelemarketerStats } from "@/app/actions/get-team-stats"
import { TelemarketerCard } from "./telemarketer-card"
import { TelemarketerDetailSheet } from "./telemarketer-detail-sheet"
import { Loader2, Users } from "lucide-react"

export function TeamGrid() {
    const [telemarketers, setTelemarketers] = useState<TelemarketerStats[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTelemarketer, setSelectedTelemarketer] = useState<TelemarketerStats | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    useEffect(() => {
        async function fetchTeam() {
            setLoading(true)
            const data = await getTeamStats()
            setTelemarketers(data)
            setLoading(false)
        }
        fetchTeam()
    }, [])

    const handleViewAssignments = (telemarketer: TelemarketerStats) => {
        setSelectedTelemarketer(telemarketer)
        setSheetOpen(true)
    }

    const handleSheetClose = () => {
        setSheetOpen(false)
        // Refresh stats when sheet closes (in case assignments changed)
        getTeamStats().then(setTelemarketers)
    }

    if (loading) {
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
                    <p className="text-2xl font-semibold mt-1 text-green-600">{totalInterested}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-2xl font-semibold mt-1 text-amber-600">{totalPending}</p>
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
        </>
    )
}
