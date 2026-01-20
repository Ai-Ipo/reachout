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
import { useAuth } from "@clerk/nextjs"

interface City {
    id: string
    short_code: string
    name: string
    created_at: string
}

export function CityList() {
    const [cities, setCities] = useState<City[]>([])
    const [loading, setLoading] = useState(true)
    const { getToken } = useAuth()

    useEffect(() => {
        let channel: any;

        async function fetchCities() {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { data, error } = await supabase
                .from("cities")
                .select("*")
                .order("name")

            if (error) {
                console.error("Error fetching cities:", error)
            } else {
                setCities(data || [])
            }
            setLoading(false)

            // Realtime subscription
            channel = supabase
                .channel('cities_changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, () => {
                    fetchCities() // Re-fetch on change
                })
                .subscribe()
        }

        fetchCities()

        return () => {
            // Cleanup if needed (requires supabase instance scope, simplified here)
            if (channel) channel.unsubscribe()
        }
    }, [getToken])

    if (loading) {
        return <Skeleton className="w-full h-[300px] rounded-xl" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Available Cities</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Short Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    No cities found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            cities.map((city) => (
                                <TableRow key={city.id}>
                                    <TableCell className="font-mono font-bold">{city.short_code}</TableCell>
                                    <TableCell>{city.name}</TableCell>
                                    <TableCell>{new Date(city.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
