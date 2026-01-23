"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

interface CompanyDetailProps {
    company: {
        id: string
        name: string
        internal_id: string
        city: { name: string } | null
        eligibility_status: string
        calling_status: string
        remarks: string | null
        turnover: number
        profit: number
        borrowed_funds: number
        financial_year: string
        website: string | null
    }
}

export function CompanyDetailView({ company }: CompanyDetailProps) {
    const [status, setStatus] = useState(company.calling_status)
    const [remarks, setRemarks] = useState(company.remarks || "")
    const [saving, setSaving] = useState(false)
    const { getToken } = useAuth()
    const router = useRouter()

    async function handleSave() {
        setSaving(true)
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        const { error } = await supabase
            .from("companies")
            .update({
                calling_status: status,
                remarks: remarks,
                updated_at: new Date().toISOString(),
            })
            .eq("id", company.id)

        setSaving(false)
        if (error) {
            alert("Failed to save")
        } else {
            router.refresh()
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4">
            {/* Left Panel: Control & Info */}
            <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 pb-10">
                <Link href="/telemarketer/start" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Assignments
                </Link>

                <Card className="border-l-4 border-l-primary/50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold">{company.name}</h2>
                                <p className="text-sm font-mono text-muted-foreground">{company.internal_id} • {company.city?.name}</p>
                            </div>
                            {company.eligibility_status === 'eligible' && <Badge variant="secondary">Eligible</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-muted-foreground block">Turnover</span>
                                <span className="font-medium">₹{company.turnover} Cr</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Profit</span>
                                <span className="font-medium">₹{company.profit} Cr</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Funds</span>
                                <span className="font-medium">₹{company.borrowed_funds} Cr</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Year</span>
                                <span className="font-medium">{company.financial_year}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Call Outcome</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Status</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select outcome" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="queued">Queued</SelectItem>
                                    <SelectItem value="callback">Callback</SelectItem>
                                    <SelectItem value="not_answered">Not Answered</SelectItem>
                                    <SelectItem value="not_contactable">Not Contactable</SelectItem>
                                    <SelectItem value="interested">Interested</SelectItem>
                                    <SelectItem value="not_interested">Not Interested</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Remarks</label>
                            <Textarea
                                placeholder="Add notes from the call..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="h-32"
                            />
                        </div>

                        <Button className="w-full" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Update</>}
                        </Button>
                    </CardContent>
                </Card>

                {/* Directors Info - collapsible potentially */}
                <div className="text-xs text-muted-foreground">
                    <h3 className="font-semibold mb-2 text-foreground">Directors</h3>
                    {/* Would map directors here if fetched */}
                    <p>Director data not loaded.</p>
                </div>
            </div>

            {/* Right Panel: Website */}
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border overflow-hidden relative">
                {company.website ? (
                    <iframe
                        src={company.website}
                        className="w-full h-full"
                        title="Company Website"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                            <ExternalLink className="w-10 h-10 mx-auto mb-2 opacity-20" />
                            <p>No website URL provided</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
