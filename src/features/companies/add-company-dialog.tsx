"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
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
import { Plus, Building2, Users, FileText, Phone, IndianRupee, Globe, X, Trash2 } from "lucide-react"
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

interface AddCompanyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cityId: string
    onSuccess?: () => void
}

export function AddCompanyDialog({ open, onOpenChange, cityId, onSuccess }: AddCompanyDialogProps) {
    const [saving, setSaving] = useState(false)
    const [telemarketers, setTelemarketers] = useState<Telemarketer[]>([])
    const [assignedTo, setAssignedTo] = useState<string | null>(null)
    const { getToken } = useAuth()

    // Fetch telemarketers from Clerk when dialog opens
    useEffect(() => {
        if (open) {
            async function fetchTelemarketers() {
                const data = await getTelemarketers()
                setTelemarketers(data)
            }
            fetchTelemarketers()
        }
    }, [open])

    const form = useForm<CompanyFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(companyFormSchema) as any,
        defaultValues: {
            city_id: cityId,
            name: "",
            financial_year: "",
            turnover: "",
            profit: "",
            borrowed_funds: "",
            loan_interest: "",
            eligibility_status: "pending",
            board_type: undefined,
            official_mail: "",
            calling_status: "queued",
            response: "",
            whatsapp_status: undefined,
            remarks: "",
            website: "",
            directors: [],
        },
    })

    const { fields: directors, append: addDirector, remove: removeDirector } = useFieldArray({
        control: form.control,
        name: "directors",
    })

    async function onSubmit(data: CompanyFormData) {
        setSaving(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // Insert company
            const { data: company, error: companyError } = await supabase
                .from("companies")
                .insert({
                    city_id: data.city_id,
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
                    assigned_to: assignedTo,
                })
                .select()
                .single()

            if (companyError) throw companyError

            // Insert directors if any
            if (data.directors && data.directors.length > 0 && company) {
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
                        toast.error("Company created but failed to add some directors")
                    }
                }
            }

            toast.success("Company created successfully")
            form.reset()
            setAssignedTo(null)
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Error creating company:", error)
            toast.error("Failed to create company. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    function handleAddDirector() {
        if (directors.length < 3) {
            addDirector({ name: "", din_no: "", contact_no: "", email: "", remark: "" })
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[800px] p-0 flex flex-col bg-background sm:border-l sm:border-border shadow-xl"
            >
                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-border/60 flex-shrink-0 bg-background z-10 flex flex-row items-center gap-4 space-y-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent -ml-2 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <SheetTitle className="text-lg font-semibold text-foreground">Add New Company</SheetTitle>
                            <p className="text-[13px] text-muted-foreground font-normal">Enter the details for the new company record</p>
                        </div>
                    </div>
                </SheetHeader>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <Form {...form}>
                        <form id="company-form" onSubmit={form.handleSubmit(onSubmit)} className="p-6 pb-20 space-y-8">

                            {/* Basic Information */}
                            <Section title="Basic Information" description="Primary details about the company structure">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Company Name <span className="text-destructive">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Acme Industries Pvt Ltd"
                                                    {...field}
                                                    className="h-9 border-border focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground/40"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="financial_year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Financial Year</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 border-border text-sm">
                                                        <SelectValue placeholder="Select FY" />
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
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Board Type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 border-border text-sm">
                                                        <SelectValue placeholder="Select board" />
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
                                <FormField
                                    control={form.control}
                                    name="eligibility_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Eligibility Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 border-border text-sm">
                                                        <SelectValue placeholder="Select status" />
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
                                    <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
                                    <Select
                                        value={assignedTo || "unassigned"}
                                        onValueChange={(value) => setAssignedTo(value === "unassigned" ? null : value)}
                                    >
                                        <SelectTrigger className="h-9 border-border text-sm mt-1">
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
                                        <FormItem className="col-span-1">
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Website</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                                                    <Input placeholder="company.com" {...field} className="h-9 pl-8 border-border text-sm" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </Section>

                            <div className="h-px bg-border/40" />

                            {/* Financials */}
                            <Section title="Financials" description="Key financial metrics">
                                <FormField
                                    control={form.control}
                                    name="turnover"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Turnover</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/50 font-medium">₹</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0.00"
                                                        {...field}
                                                        className="h-9 pl-6 pr-8 border-border text-sm tabular-nums"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/50 font-medium">Cr</span>
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
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Profit</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/60 font-medium">₹</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        {...field}
                                                        className="h-9 pl-6 pr-8 border-border text-sm tabular-nums"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/60 font-medium">Cr</span>
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
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Borrowed Funds</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/50 font-medium">₹</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="0.00"
                                                        {...field}
                                                        className="h-9 pl-6 pr-8 border-border text-sm tabular-nums"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/50 font-medium">Cr</span>
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
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Loan Interest</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="100"
                                                        placeholder="0.0"
                                                        {...field}
                                                        className="h-9 pr-8 border-border text-sm tabular-nums"
                                                    />
                                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground/60 font-medium">%</span>
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </Section>

                            <div className="h-px bg-border/40" />

                            {/* Directors */}
                            <Section
                                title="Directors"
                                description="Add up to 3 directors"
                                action={
                                    directors.length < 3 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleAddDirector}
                                            className="h-7 text-xs text-primary hover:bg-primary/5 font-medium"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Add Director
                                        </Button>
                                    )
                                }
                            >
                                <div className="col-span-2 space-y-3">
                                    {directors.length === 0 ? (
                                        <div
                                            onClick={handleAddDirector}
                                            className="flex flex-col items-center justify-center py-8 border border-dashed border-border rounded-lg hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-colors group"
                                        >
                                            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                                                <Users className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary" />
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Click to add a director</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">You can add up to 3 directors</p>
                                        </div>
                                    ) : (
                                        directors.map((field, index) => (
                                            <div key={field.id} className="p-4 border border-border/50 bg-muted/20 rounded-lg space-y-4 group hover:border-border transition-colors">
                                                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                                    <span className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
                                                        <span className="h-5 w-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">
                                                            {index + 1}
                                                        </span>
                                                        Director Details
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeDirector(index)}
                                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`directors.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Name" {...field} className="h-8 text-sm bg-background" />
                                                                </FormControl>
                                                                <FormMessage className="text-[11px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`directors.${index}.din_no`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="DIN No" maxLength={8} {...field} className="h-8 text-sm bg-background font-mono" />
                                                                </FormControl>
                                                                <FormMessage className="text-[11px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`directors.${index}.contact_no`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder="Phone" {...field} className="h-8 text-sm bg-background" />
                                                                </FormControl>
                                                                <FormMessage className="text-[11px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`directors.${index}.email`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input type="email" placeholder="Email" {...field} className="h-8 text-sm bg-background" />
                                                                </FormControl>
                                                                <FormMessage className="text-[11px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`directors.${index}.remark`}
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2">
                                                                <FormControl>
                                                                    <Input placeholder="Optional notes for this director" {...field} className="h-8 text-sm bg-background" />
                                                                </FormControl>
                                                                <FormMessage className="text-[11px]" />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Section>

                            <div className="h-px bg-border/40" />

                            {/* Contact & Status */}
                            <Section title="Contact & Status" description="Communication details and current status">
                                <FormField
                                    control={form.control}
                                    name="official_mail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Official Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="info@company.com" {...field} className="h-9 border-border text-sm" />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="calling_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Calling Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 border-border text-sm">
                                                        <SelectValue placeholder="Select status" />
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
                                            <FormLabel className="text-xs font-medium text-muted-foreground">WhatsApp Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 border-border text-sm">
                                                        <SelectValue placeholder="Select status" />
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
                                <FormField
                                    control={form.control}
                                    name="response"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="text-xs font-medium text-muted-foreground">Response</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Latest response or notes on contact..." {...field} className="h-9 border-border text-sm" />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </Section>

                            <div className="h-px bg-border/40" />

                            {/* Internal Notes */}
                            <Section title="Notes" description="Internal team remarks">
                                <FormField
                                    control={form.control}
                                    name="remarks"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Add any internal remarks here..."
                                                    {...field}
                                                    className="min-h-[80px] resize-none border-border text-sm bg-muted/20"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[11px]" />
                                        </FormItem>
                                    )}
                                />
                            </Section>
                        </form>
                    </Form>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 border-t border-border/60 bg-background flex items-center justify-end gap-3 z-10">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="h-9 text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="company-form"
                        disabled={saving}
                        className="h-9 min-w-[120px] font-medium shadow-sm hover:shadow"
                    >
                        {saving ? "Creating..." : "Create Company"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// Simplified Section component
function Section({
    title,
    description,
    children,
    action
}: {
    title: string
    description?: string
    children: React.ReactNode
    action?: React.ReactNode
}) {
    return (
        <section className="space-y-4">
            <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    {description && <p className="text-[11px] text-muted-foreground/70">{description}</p>}
                </div>
                {action}
            </div>
            <div className="grid grid-cols-2 gap-4 gap-y-5">
                {children}
            </div>
        </section>
    )
}

// Generate financial years in Indian format (YYYY-YY)
// Returns last 10 years plus next year
function generateFinancialYears(): string[] {
    const currentYear = new Date().getFullYear()
    const years: string[] = []

    // Generate from next year to 10 years back
    for (let year = currentYear + 1; year >= currentYear - 100; year--) {
        const nextYearShort = (year + 1).toString().slice(-2)
        years.push(`${year}-${nextYearShort}`)
    }

    return years
}

