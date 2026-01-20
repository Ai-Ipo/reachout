"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs" // Correct import
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompanyTable } from "@/features/companies/company-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2, Calendar, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { CityDialog } from "@/features/cities/city-dialog"

export default function CityDetailPage() {
    const params = useParams()
    const cityId = params?.id as string
    const [city, setCity] = useState<any>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const router = useRouter()
    const { getToken } = useAuth()

    async function fetchCity() {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)
        const { data, error } = await supabase
            .from("cities")
            .select("*")
            .eq("id", cityId)
            .single()

        if (data) {
            setCity(data)
        }
    }

    useEffect(() => {
        if (cityId) fetchCity()
    }, [cityId])

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this city? This will likely fail if companeis are attached.")) return

        const token = await getToken()
        const supabase = createClient(token)
        const { error } = await supabase.from("cities").delete().eq("id", cityId)

        if (!error) {
            router.push("/")
        } else {
            alert("Could not delete city. Check if it has companies assigned.")
        }
    }

    if (!city) return <div className="p-8">Loading city...</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        {city.name}
                        <span className="text-lg text-muted-foreground font-normal">({city.short_code})</span>
                    </h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete City
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Registered in this location</p>
                    </CardContent>
                </Card>
                {/* Add more stats cards here later */}
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Companies</h3>
                <CompanyTable initialCityId={cityId} />
            </div>

            <CityDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={fetchCity}
                cityToEdit={city} // You'll need to update CityDialog to accept this prop
            />
        </div>
    )
}
