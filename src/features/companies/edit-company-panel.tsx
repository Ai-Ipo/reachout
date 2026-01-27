"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
    companyFormSchema,
    type CompanyFormData,
    callingStatusLabels,
    eligibilityStatusLabels,
    boardTypeLabels,
    whatsappStatusLabels,
} from "@/lib/schemas/company-schema"
import { X, Plus, Trash2, ChevronDown, ChevronRight, Globe, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getTelemarketers, type Telemarketer } from "@/app/actions/get-telemarketers"
import { cn } from "@/lib/utils"

import {
    StatusBadge,
    getCallingStatusVariant,
    getEligibilityStatusVariant,
    getBoardStatusVariant,
    getWhatsappStatusVariant
} from "@/components/ui/status-badge"

import type { Company, Director } from "./company-data-table"

interface EditCompanyPanelProps {
    company: Company
    onClose: () => void
    onSuccess?: (updatedCompany?: Company | null) => void
}

// Generate financial years
function generateFinancialYears(): string[] {
    const currentYear = new Date().getFullYear()
    const years: string[] = []
    for (let year = currentYear + 1; year >= currentYear - 10; year--) {
        const nextYearShort = (year + 1).toString().slice(-2)
        years.push(`${year}-${nextYearShort}`)
    }
    return years
}


export function EditCompanyPanel({ company, onClose, onSuccess }: EditCompanyPanelProps) {
    const [saving, setSaving] = useState(false)
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        financials: false,
        directors: false,
        contact: false,
        notes: false,
    })
    const [telemarketers, setTelemarketers] = useState<Telemarketer[]>([])
    const [assignedTo, setAssignedTo] = useState<string | null>(company.assigned_to || null)
    const { getToken } = useAuth()

    // Fetch telemarketers from Clerk on mount
    useEffect(() => {
        async function fetchTelemarketers() {
            const data = await getTelemarketers()
            setTelemarketers(data)
        }
        fetchTelemarketers()
    }, [])

    const form = useForm<CompanyFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(companyFormSchema) as any,
        defaultValues: {
            id: company.id,
            city_id: company.city_id,
            name: company.name || "",
            financial_year: company.financial_year || "",
            turnover: company.turnover?.toString() || "",
            profit: company.profit?.toString() || "",
            borrowed_funds: company.borrowed_funds?.toString() || "",
            loan_interest: company.loan_interest?.toString() || "",
            eligibility_status: company.eligibility_status as "eligible" | "ineligible" | "pending" || "pending",
            board_type: company.board_type as "SME" | "Main" | "Other" | undefined,
            official_mail: company.official_mail || "",
            calling_status: company.calling_status as "queued" | "callback" | "not_answered" | "not_contactable" | "interested" | "not_interested" || "queued",
            response: company.response || "",
            whatsapp_status: company.whatsapp_status as "not_sent" | "sent" | "delivered" | "read" | "replied" | "failed" | undefined,
            remarks: company.remarks || "",
            website: company.website || "",
            directors: company.directors?.map(d => ({
                id: d.id,
                din_no: d.din_no || "",
                name: d.name || "",
                contact_no: d.contact_no || "",
                email: d.email || "",
                email_status: d.email_status as "valid" | "invalid" | "unknown" | "bounced" | undefined,
                remark: d.remark || "",
            })) || [],
        },
    })

    const { fields: directors, append: addDirector, remove: removeDirector } = useFieldArray({
        control: form.control,
        name: "directors",
    })

    // Reset form when company changes
    useEffect(() => {
        form.reset({
            id: company.id,
            city_id: company.city_id,
            name: company.name || "",
            financial_year: company.financial_year || "",
            turnover: company.turnover?.toString() || "",
            profit: company.profit?.toString() || "",
            borrowed_funds: company.borrowed_funds?.toString() || "",
            loan_interest: company.loan_interest?.toString() || "",
            eligibility_status: company.eligibility_status as "eligible" | "ineligible" | "pending" || "pending",
            board_type: company.board_type as "SME" | "Main" | "Other" | undefined,
            official_mail: company.official_mail || "",
            calling_status: company.calling_status as "queued" | "callback" | "not_answered" | "not_contactable" | "interested" | "not_interested" || "queued",
            response: company.response || "",
            whatsapp_status: company.whatsapp_status as "not_sent" | "sent" | "delivered" | "read" | "replied" | "failed" | undefined,
            remarks: company.remarks || "",
            website: company.website || "",
            directors: company.directors?.map(d => ({
                id: d.id,
                din_no: d.din_no || "",
                name: d.name || "",
                contact_no: d.contact_no || "",
                email: d.email || "",
                email_status: d.email_status as "valid" | "invalid" | "unknown" | "bounced" | undefined,
                remark: d.remark || "",
            })) || [],
        })
    }, [company, form])

    // Reset form when company changes (fix for stale data)
    useEffect(() => {
        if (company) {
            form.reset({
                name: company.name,
                city_id: company.city_id,
                financial_year: company.financial_year || "",
                turnover: company.turnover?.toString() || "",
                profit: company.profit?.toString() || "",
                borrowed_funds: company.borrowed_funds?.toString() || "",
                loan_interest: company.loan_interest?.toString() || "",
                eligibility_status: company.eligibility_status as "eligible" | "ineligible" | "pending",
                board_type: (company.board_type || "") as "private" | "public" | "llp" | "opc" | "nidhi",
                official_mail: company.official_mail || "",
                calling_status: company.calling_status as "pending" | "interested" | "not_interested" | "not_contactable",
                response: company.response || "",
                whatsapp_status: (company.whatsapp_status || "neutral") as "neutral" | "sent" | "received" | "failed",
                remarks: company.remarks || "",
                website: company.website || "",
                assigned_to: company.assigned_to || "unassigned",
                directors: company.directors || [{ name: "", contact_no: "" }]
            })
        }
    }, [company, form])

    async function onSubmit(data: CompanyFormData) {
        setSaving(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // Update company
            const { error: companyError } = await supabase
                .from("companies")
                .update({
                    name: data.name,
                    financial_year: data.financial_year || null,
                    turnover: data.turnover ? parseFloat(data.turnover) : null,
                    profit: data.profit ? parseFloat(data.profit) : null,
                    borrowed_funds: data.borrowed_funds ? parseFloat(data.borrowed_funds) : null,
                    loan_interest: data.loan_interest ? parseFloat(data.loan_interest) : null,
                    eligibility_status: data.eligibility_status,
                    board_type: data.board_type || null,
                    official_mail: data.official_mail || null,
                    calling_status: data.calling_status,
                    response: data.response || null,
                    whatsapp_status: data.whatsapp_status || null,
                    remarks: data.remarks || null,
                    website: data.website || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", company.id)

            if (companyError) throw companyError

            // Handle directors - delete existing and insert new
            // First delete all existing directors for this company
            const { error: deleteError } = await supabase
                .from("directors")
                .delete()
                .eq("company_id", company.id)

            if (deleteError) {
                console.error("Director delete error:", deleteError)
            }

            // Insert new directors
            if (data.directors && data.directors.length > 0) {
                const directorsToInsert = data.directors
                    .filter(d => d.name && d.name.trim() !== "")
                    .map(d => ({
                        company_id: company.id,
                        din_no: d.din_no || null,
                        name: d.name,
                        contact_no: d.contact_no || null,
                        email: d.email || null,
                        email_status: d.email_status || null,
                        remark: d.remark || null,
                    }))

                if (directorsToInsert.length > 0) {
                    const { error: directorError } = await supabase
                        .from("directors")
                        .insert(directorsToInsert)

                    if (directorError) {
                        console.error("Director insert error:", directorError)
                        toast.error("Company updated but failed to save some directors")
                    }
                }
            }

            // Fetch the complete updated company object to pass back
            const { data: updatedCompany, error: fetchError } = await supabase
                .from("companies")
                .select(`
                    id,
                    internal_id,
                    city_id,
                    city:cities(id, name, short_code),
                    name,
                    financial_year,
                    turnover,
                    profit,
                    borrowed_funds,
                    loan_interest,
                    eligibility_status,
                    board_type,
                    official_mail,
                    calling_status,
                    response,
                    whatsapp_status,
                    remarks,
                    website,
                    assigned_to,
                    assigned_profile:profiles!assigned_to(id, full_name, email, image_url),
                    directors(id, din_no, name, contact_no, email, email_status, remark)
                `)
                .eq("id", company.id)
                .single()

            if (fetchError) {
                console.error("Error fetching updated company:", fetchError)
                // Fallback to reload if fetch fails, but still success toast
                onSuccess?.(null)
            } else {
                // Transform to match Company interface (handling relations)
                const transformedCompany: Company = {
                    ...updatedCompany,
                    city: Array.isArray(updatedCompany.city) ? updatedCompany.city[0] : updatedCompany.city,
                    assigned_profile: Array.isArray(updatedCompany.assigned_profile) ? updatedCompany.assigned_profile[0] : updatedCompany.assigned_profile,
                }

                toast.success("Company updated")
                onSuccess?.(transformedCompany)
            }
        } catch (error) {
            console.error("Error updating company:", error)
            toast.error("Failed to update company")
        } finally {
            setSaving(false)
        }
    }

    function handleAddDirector() {
        if (directors.length < 3) {
            addDirector({ name: "", din_no: "", contact_no: "", email: "", remark: "" })
        }
    }

    function toggleSection(section: string) {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    // Check if a section has errors
    const { errors } = form.formState
    const sectionErrors = {
        basic: !!(errors.name || errors.financial_year || errors.board_type || errors.eligibility_status || errors.website),
        financials: !!(errors.turnover || errors.profit || errors.borrowed_funds || errors.loan_interest),
        directors: !!(errors.directors),
        contact: !!(errors.official_mail || errors.calling_status || errors.whatsapp_status),
        notes: !!(errors.response || errors.remarks),
    }

    return (
        <div className="h-full flex flex-col bg-background border-l border-border shadow-xl animate-in slide-in-from-right-10 duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground truncate">{company.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Edit properties</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <Form {...form}>
                    <form id="edit-company-form" onSubmit={form.handleSubmit(onSubmit)} className="py-2">
                        {/* Basic Information */}
                        <CollapsibleSection
                            title="Basic Information"
                            expanded={expandedSections.basic}
                            onToggle={() => toggleSection("basic")}
                            hasError={sectionErrors.basic}
                        >
                            <div className="space-y-3 px-4 pb-3">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Company Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="h-8 text-sm" />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="financial_year"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Financial Year</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {generateFinancialYears().map((fy) => (
                                                            <SelectItem key={fy} value={fy} className="text-sm">{fy}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="board_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Board Type</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(boardTypeLabels).map(([value, label]) => (
                                                            <SelectItem key={value} value={value} className="text-sm">
                                                                <StatusBadge variant={getBoardStatusVariant(value)} size="sm" className="font-normal">
                                                                    {label}
                                                                </StatusBadge>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="eligibility_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Eligibility</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(eligibilityStatusLabels).map(([value, label]) => (
                                                        <SelectItem key={value} value={value} className="text-sm">
                                                            <StatusBadge variant={getEligibilityStatusVariant(value)} size="sm" className="font-normal">
                                                                {label}
                                                            </StatusBadge>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <div>
                                    <label className="text-xs text-muted-foreground">Assigned To</label>
                                    <Select
                                        value={assignedTo || "unassigned"}
                                        onValueChange={async (value) => {
                                            const newValue = value === "unassigned" ? null : value
                                            setAssignedTo(newValue)
                                            // Update immediately in database
                                            const token = await getToken({ template: "supabase", skipCache: true })
                                            const supabase = createClient(token)
                                            await supabase
                                                .from("companies")
                                                .update({ assigned_to: newValue, updated_at: new Date().toISOString() })
                                                .eq("id", company.id)
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-sm mt-1">
                                            <SelectValue placeholder="Select telemarketer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned" className="text-sm text-muted-foreground">
                                                Unassigned
                                            </SelectItem>
                                            {telemarketers.map((profile) => {
                                                const initials = profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || profile.email?.[0]?.toUpperCase() || "?"
                                                return (
                                                    <SelectItem key={profile.id} value={profile.id} className="text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="w-5 h-5 flex-shrink-0 border border-border/50">
                                                                <AvatarImage src={profile.image_url || undefined} />
                                                                <AvatarFallback className="text-[10px] bg-muted text-foreground/70">{initials}</AvatarFallback>
                                                            </Avatar>
                                                            {profile.full_name || profile.email?.split("@")[0] || "Unknown"}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Website</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                                    <Input {...field} placeholder="https://" className="h-8 text-sm pl-8 " />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Financials */}
                        <CollapsibleSection
                            title="Financials"
                            expanded={expandedSections.financials}
                            onToggle={() => toggleSection("financials")}
                            hasError={sectionErrors.financials}
                        >
                            <div className="grid grid-cols-2 gap-3 px-4 pb-3">
                                <FormField
                                    control={form.control}
                                    name="turnover"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Turnover (Cr)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">₹</span>
                                                    <Input type="number" step="0.01" min="0" {...field} className="h-8 text-sm pl-6 tabular-nums" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="profit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Profit (Cr)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">₹</span>
                                                    <Input type="number" step="0.01" {...field} className="h-8 text-sm pl-6 tabular-nums" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="borrowed_funds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Borrowed Funds (Cr)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">₹</span>
                                                    <Input type="number" step="0.01" min="0" {...field} className="h-8 text-sm pl-6 tabular-nums" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="loan_interest"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Loan Interest (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" min="0" max="100" {...field} className="h-8 text-sm tabular-nums" />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Directors */}
                        <CollapsibleSection
                            title={`Directors${directors.length > 0 ? ` (${directors.length})` : ""}`}
                            expanded={expandedSections.directors}
                            onToggle={() => toggleSection("directors")}
                            hasError={sectionErrors.directors}
                            action={
                                directors.length < 3 && expandedSections.directors && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleAddDirector(); }}
                                        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add
                                    </button>
                                )
                            }
                        >
                            <div className="px-4 pb-3 space-y-3">
                                {directors.length === 0 ? (
                                    <button
                                        type="button"
                                        onClick={handleAddDirector}
                                        className="w-full py-4 border border-dashed border-border rounded text-sm text-muted-foreground hover:border-border/80 hover:text-foreground transition-colors"
                                    >
                                        + Add director
                                    </button>
                                ) : (
                                    directors.map((field, index) => (
                                        <div key={field.id} className="p-3 bg-muted/30 rounded border border-border/60 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">Director {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDirector(index)}
                                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`directors.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Name" {...field} className="h-7 text-xs bg-background" />
                                                            </FormControl>
                                                            <FormMessage className="text-[10px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`directors.${index}.din_no`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="DIN" maxLength={8} {...field} className="h-7 text-xs bg-background font-mono" />
                                                            </FormControl>
                                                            <FormMessage className="text-[10px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`directors.${index}.contact_no`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input placeholder="Phone" {...field} className="h-7 text-xs bg-background" />
                                                            </FormControl>
                                                            <FormMessage className="text-[10px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`directors.${index}.email`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input type="email" placeholder="Email" {...field} className="h-7 text-xs bg-background" />
                                                            </FormControl>
                                                            <FormMessage className="text-[10px]" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name={`directors.${index}.remark`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Notes" {...field} className="h-7 text-xs bg-background" />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </CollapsibleSection>

                        {/* Contact & Status */}
                        <CollapsibleSection
                            title="Contact & Status"
                            expanded={expandedSections.contact}
                            onToggle={() => toggleSection("contact")}
                            hasError={sectionErrors.contact}
                        >
                            <div className="space-y-3 px-4 pb-3">
                                <FormField
                                    control={form.control}
                                    name="official_mail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Official Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" {...field} className="h-8 text-sm" />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="calling_status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">Calling Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(callingStatusLabels).map(([value, label]) => (
                                                            <SelectItem key={value} value={value} className="text-sm">
                                                                <StatusBadge variant={getCallingStatusVariant(value)} size="sm" className="font-normal">
                                                                    {label}
                                                                </StatusBadge>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="whatsapp_status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs text-muted-foreground">WhatsApp</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {Object.entries(whatsappStatusLabels).map(([value, label]) => (
                                                            <SelectItem key={value} value={value} className="text-sm">
                                                                <StatusBadge variant={getWhatsappStatusVariant(value)} size="sm" className="font-normal">
                                                                    {label}
                                                                </StatusBadge>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[11px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="response"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Response</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="h-8 text-sm" />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CollapsibleSection>

                        {/* Notes */}
                        <CollapsibleSection
                            title="Notes"
                            expanded={expandedSections.notes}
                            onToggle={() => toggleSection("notes")}
                            hasError={sectionErrors.notes}
                        >
                            <div className="px-4 pb-3">
                                <FormField
                                    control={form.control}
                                    name="remarks"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Internal remarks..."
                                                    className="min-h-[80px] text-sm resize-none"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CollapsibleSection>
                    </form>
                </Form>
            </div>

            {/* Footer */}
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40 bg-muted/10">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    disabled={saving}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="edit-company-form"
                    size="sm"
                    disabled={saving}
                    className="min-w-[100px]"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        "Save changes"
                    )}
                </Button>
            </div>
        </div>
    )
}

// Collapsible section component
function CollapsibleSection({
    title,
    expanded,
    onToggle,
    children,
    action,
    hasError,
}: {
    title: string
    expanded: boolean
    onToggle: () => void
    children: React.ReactNode
    action?: React.ReactNode
    hasError?: boolean
}) {
    return (
        <div className="border-b border-border/40 last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors",
                    hasError && !expanded && "bg-destructive/5"
                )}
            >
                <div className="flex items-center gap-2">
                    {expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">{title}</span>
                    {hasError && !expanded && (
                        <span className="flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded font-medium">
                            Has errors
                        </span>
                    )}
                </div>
                {action}
            </button>
            {expanded && children}
        </div>
    )
}
