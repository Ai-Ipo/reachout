"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import { companyFormSchema, type CompanyFormData, callingStatusLabels, eligibilityStatusLabels } from "@/lib/schemas/company-schema"
import { Plus, Trash2 } from "lucide-react"

interface AddCompanyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cityId: string
    onSuccess?: () => void
}

export function AddCompanyDialog({ open, onOpenChange, cityId, onSuccess }: AddCompanyDialogProps) {
    const [saving, setSaving] = useState(false)
    const { getToken } = useAuth()

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
            board_type: "",
            official_mail: "",
            representative_name: "",
            calling_status: "queued",
            response: "",
            whatsapp_status: "",
            remarks: "",
            website: "",
            directors: [{ name: "", din_no: "", contact_no: "", email: "", remark: "" }],
        },
    })

    const directors = form.watch("directors") || []

    function addDirector() {
        if (directors.length < 3) {
            form.setValue("directors", [
                ...directors,
                { name: "", din_no: "", contact_no: "", email: "", remark: "" },
            ])
        }
    }

    function removeDirector(index: number) {
        form.setValue("directors", directors.filter((_, i) => i !== index))
    }

    async function onSubmit(data: CompanyFormData) {
        setSaving(true)
        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // Insert company - convert string numbers to actual numbers
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
                    representative_name: data.representative_name || null,
                    calling_status: data.calling_status,
                    response: data.response || null,
                    whatsapp_status: data.whatsapp_status || null,
                    remarks: data.remarks || null,
                    website: data.website || null,
                })
                .select()
                .single()

            if (companyError) throw companyError

            // Insert directors
            if (data.directors && data.directors.length > 0 && company) {
                const directorsToInsert = data.directors
                    .filter(d => d.name) // Only insert directors with names
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

                    if (directorError) console.error("Director insert error:", directorError)
                }
            }

            form.reset()
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Error creating company:", error)
            alert("Failed to create company")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Company</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                        {/* Basic Info Section */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Basic Information</h3>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter company name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="financial_year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Financial Year</FormLabel>
                                            <FormControl>
                                                <Input placeholder="2023-24" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="board_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Board Type</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SME / Main" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="eligibility_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Eligibility</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(eligibilityStatusLabels).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="calling_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Calling Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.entries(callingStatusLabels).map(([value, label]) => (
                                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* Financials Section */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Financials</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="turnover"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Turnover (₹ Cr)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="profit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Profit (₹ Cr)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="borrowed_funds"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Borrowed Funds (₹ Cr)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="loan_interest"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Loan Interest (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="0.0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* Directors Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Directors (max 3)</h3>
                                {directors.length < 3 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={addDirector}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                )}
                            </div>
                            {directors.map((_, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Director {index + 1}</span>
                                        {directors.length > 1 && (
                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeDirector(index)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <FormField
                                            control={form.control}
                                            name={`directors.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Director name" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`directors.${index}.din_no`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">DIN</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="DIN number" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`directors.${index}.contact_no`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Contact</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+91 98765 43210" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`directors.${index}.email`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs">Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="email@company.com" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name={`directors.${index}.remark`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Remark</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Notes about this director" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                        </section>

                        {/* Contact & Notes Section */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">Contact & Notes</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="official_mail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Official Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="info@company.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="representative_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Representative</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contact person" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="website"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Website</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://company.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="whatsapp_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>WhatsApp Status</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Sent / Replied / etc." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="response"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Response</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Any response received" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="remarks"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Internal Remarks</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Internal notes about this company" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </section>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Creating..." : "Create Company"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
