"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import Link from "next/link"
import {
    ArrowLeft,
    ExternalLink,
    Phone,
    Mail,
    Globe,
    Building2,
    User,
    Hash,
    Calendar,
    IndianRupee,
    Percent,
    MessageSquare,
    Save,
    Copy,
    CheckCircle2,
} from "lucide-react"
import { DirectorCard, type Director } from "./director-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    StatusBadge,
    getCallingStatusVariant,
    getEligibilityStatusVariant,
    getBoardStatusVariant,
    getWhatsappStatusVariant,
} from "@/components/ui/status-badge"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    callingStatusLabels,
    eligibilityStatusLabels,
    boardTypeLabels,
    whatsappStatusLabels,
    type CallingStatus,
    type WhatsappStatus,
} from "@/lib/schemas/company-schema"
import { formatCurrency, formatPercent, formatFinancialYear } from "@/lib/format"


function DataItem({ icon: Icon, label, value, className }: { icon: any, label: string, value: string | number | undefined, className?: string }) {
    return (
        <div className={cn("p-2.5 bg-muted/20 rounded-md border", className)}>
            <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider leading-none">{label}</span>
            </div>
            <div className="text-sm font-semibold text-foreground truncate tabular-nums">{value || "-"}</div>
        </div>
    )
}

interface Company {
    id: string
    internal_id: string
    city_id: string
    name: string
    financial_year?: string
    turnover?: number
    profit?: number
    borrowed_funds?: number
    loan_interest?: number
    eligibility_status: string
    board_type?: string
    official_mail?: string
    calling_status: string
    response?: string
    whatsapp_status?: string
    remarks?: string
    website?: string
    assigned_to?: string | null
    city?: { id: string; name: string; short_code: string } | null
    assigned_profile?: { id: string; full_name: string | null; email: string | null } | null
    directors?: Director[]
}

interface CompanyPageProps {
    company: Company
    backUrl?: string
    backLabel?: string
}

export function CompanyPage({ company, backUrl, backLabel = "Back" }: CompanyPageProps) {
    const defaultBackUrl = backUrl || `/admin/cities/${company.city_id}`
    const [callingStatus, setCallingStatus] = useState<CallingStatus>(company.calling_status as CallingStatus)
    const [whatsappStatus, setWhatsappStatus] = useState<WhatsappStatus | undefined>(company.whatsapp_status as WhatsappStatus | undefined)
    const [response, setResponse] = useState(company.response || "")
    const [remarks, setRemarks] = useState(company.remarks || "")
    const [saving, setSaving] = useState(false)
    const { getToken } = useAuth()

    async function handleSave() {
        setSaving(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            const { error } = await supabase
                .from("companies")
                .update({
                    calling_status: callingStatus,
                    whatsapp_status: whatsappStatus || null,
                    response: response || null,
                    remarks: remarks || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", company.id)

            if (error) throw error
            toast.success("Changes saved")
        } catch (error) {
            console.error("Error saving:", error)
            toast.error("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    function copyToClipboard(text: string, label: string) {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied`)
    }

    const websiteUrl = company.website
        ? company.website.startsWith("http")
            ? company.website
            : `https://${company.website}`
        : null

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background">
                <div className="flex items-center gap-4">
                    <Link
                        href={defaultBackUrl}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {backLabel}
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <div>
                        <h1 className="text-xl font-semibold leading-tight tracking-tight">{company.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono text-xs">{company.internal_id}</span>
                            <span>•</span>
                            <span>{company.city?.name}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge variant={getEligibilityStatusVariant(company.eligibility_status)}>
                        {eligibilityStatusLabels[company.eligibility_status as keyof typeof eligibilityStatusLabels] || company.eligibility_status}
                    </StatusBadge>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Split Layout */}
                <div className="w-[450px] border-r flex flex-col bg-background h-full">
                    {/* Zone A: Context Deck (Scrollable) */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <div className="p-5 space-y-6">

                            {/* Directors - Top Priority */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-foreground">Directors ({company.directors?.length || 0})</h3>
                                    {company.board_type && (
                                        <StatusBadge variant={getBoardStatusVariant(company.board_type)} size="sm">
                                            {boardTypeLabels[company.board_type as keyof typeof boardTypeLabels] || company.board_type}
                                        </StatusBadge>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {company.directors && company.directors.length > 0 ? (
                                        company.directors.map((director) => (
                                            <DirectorCard key={director.id} director={director} onCopy={copyToClipboard} />
                                        ))
                                    ) : (
                                        <div className="px-4 py-8 bg-muted/30 rounded-lg border border-dashed text-sm text-muted-foreground text-center">
                                            No directors added
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            {/* Financial Snapshot */}
                            <section>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Company Snapshot</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/10 rounded-md border">
                                        <div className="text-xs text-muted-foreground mb-1">Turnover</div>
                                        <div className="text-lg font-semibold tabular-nums">{formatCurrency(company.turnover)}</div>
                                    </div>
                                    <div className="p-3 bg-muted/10 rounded-md border">
                                        <div className="text-xs text-muted-foreground mb-1">Profit</div>
                                        <div className="text-lg font-semibold tabular-nums">{formatCurrency(company.profit)}</div>
                                    </div>
                                    <DataItem icon={IndianRupee} label="Borrowed Funds" value={formatCurrency(company.borrowed_funds)} />
                                    <DataItem icon={Percent} label="Interest Rate" value={formatPercent(company.loan_interest)} />
                                    <DataItem icon={Calendar} label="Financial Year" value={formatFinancialYear(company.financial_year)} className="col-span-2" />
                                </div>
                            </section>

                            <div className="h-px bg-border" />

                            {/* Contact Methods */}
                            <section>
                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Contact Channels</h3>
                                <div className="space-y-2">
                                    {company.official_mail && (
                                        <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group transition-colors">
                                            <div className="flex items-center gap-2.5 text-sm">
                                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                                    <Mail className="w-3.5 h-3.5" />
                                                </div>
                                                <a href={`mailto:${company.official_mail}`} className="text-foreground hover:underline">
                                                    {company.official_mail}
                                                </a>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(company.official_mail!, "Email")}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-background rounded-md border shadow-sm transition-all"
                                            >
                                                <Copy className="w-3 h-3 text-muted-foreground" />
                                            </button>
                                        </div>
                                    )}
                                    {websiteUrl && (
                                        <div className="flex items-center gap-2.5 text-sm p-2 hover:bg-muted/50 rounded-md transition-colors">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                                                <Globe className="w-3.5 h-3.5" />
                                            </div>
                                            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline flex items-center gap-1">
                                                {company.website}
                                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                            </a>
                                        </div>
                                    )}
                                    {company.assigned_profile && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 px-2">
                                            <User className="w-3 h-3" />
                                            <span>Assigned to {company.assigned_profile.full_name || company.assigned_profile.email}</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Zone B: Action Deck (Fixed Bottom) */}
                    <div className="border-t bg-blue-50/50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10 border-l-4 border-l-primary">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="call-updates" className="border-b-0">
                                <AccordionTrigger className="px-5 py-3 hover:no-underline hover:bg-blue-100/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-foreground">Call Updates</span>
                                        {saving && <span className="text-xs text-muted-foreground animate-pulse font-normal">Saving...</span>}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-5 pb-5 pt-0">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">Call Status</label>
                                                <Select value={callingStatus} onValueChange={(v) => setCallingStatus(v as CallingStatus)}>
                                                    <SelectTrigger className="h-9 bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(callingStatusLabels).map(([value, label]) => (
                                                            <SelectItem key={value} value={value}>
                                                                <StatusBadge variant={getCallingStatusVariant(value)} size="sm">
                                                                    {label}
                                                                </StatusBadge>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                                                <Select value={whatsappStatus || "none"} onValueChange={(v) => setWhatsappStatus(v === "none" ? undefined : v as WhatsappStatus)}>
                                                    <SelectTrigger className="h-9 bg-background">
                                                        <SelectValue placeholder="Not set" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none" className="text-muted-foreground">Not set</SelectItem>
                                                        {Object.entries(whatsappStatusLabels).map(([value, label]) => (
                                                            <SelectItem key={value} value={value}>
                                                                <StatusBadge variant={getWhatsappStatusVariant(value)} size="sm">
                                                                    {label}
                                                                </StatusBadge>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Response / Outcome</label>
                                            <Textarea
                                                value={response}
                                                onChange={(e) => setResponse(e.target.value)}
                                                placeholder="Outcome / Response..."
                                                className="min-h-[60px] resize-none bg-background text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-muted-foreground">Internal Remarks</label>
                                            <Textarea
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="Internal remarks..."
                                                className="min-h-[40px] resize-none bg-background text-sm"
                                            />
                                        </div>

                                        <Button onClick={handleSave} disabled={saving} className="w-full">
                                            {saving ? "Saving..." : "Save Update"}
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                {/* Right Panel - Website */}
                <div className="flex-1 flex flex-col relative bg-muted-foreground p-3">
                    {websiteUrl ? (
                        <div className="flex-1 rounded-xl shadow-sm overflow-hidden">
                            <iframe
                                src={websiteUrl}
                                className="w-full h-full"
                                title="Company Website"
                                sandbox="allow-scripts allow-same-origin allow-popups"
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-background border-4 border-dashed border-muted/30 rounded-xl m-4 bg-muted-foreground">
                            <Globe className="w-12 h-12 mb-3" />
                            <p className="text-sm">No website available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


