import { z } from "zod"

// Enums matching database types
export const callingStatusEnum = z.enum([
    "queued",
    "picked_up",
    "not_answered",
    "not_contactable",
    "interested",
    "not_interested"
])

export const eligibilityStatusEnum = z.enum([
    "eligible",
    "ineligible",
    "pending"
])

export const emailStatusEnum = z.enum([
    "valid",
    "invalid",
    "unknown",
    "bounced"
])

// Director schema
export const directorSchema = z.object({
    id: z.string().uuid().optional(),
    din_no: z.string().optional().default(""),
    name: z.string().optional().default(""),
    contact_no: z.string().optional().default(""),
    email: z.string().optional().default(""),
    email_status: emailStatusEnum.optional(),
    remark: z.string().optional().default("")
})

// Company form schema (separate from DB schema for form handling)
export const companyFormSchema = z.object({
    id: z.string().uuid().optional(),
    internal_id: z.string().optional().default(""),
    city_id: z.string().min(1, "City is required"),
    name: z.string().min(2, "Company name must be at least 2 characters"),
    financial_year: z.string().optional().default(""),
    turnover: z.string().optional().default(""),
    profit: z.string().optional().default(""),
    borrowed_funds: z.string().optional().default(""),
    loan_interest: z.string().optional().default(""),
    eligibility_status: eligibilityStatusEnum.default("pending"),
    board_type: z.string().optional().default(""),
    official_mail: z.string().optional().default(""),
    representative_name: z.string().optional().default(""),
    calling_status: callingStatusEnum.default("queued"),
    response: z.string().optional().default(""),
    whatsapp_status: z.string().optional().default(""),
    remarks: z.string().optional().default(""),
    website: z.string().optional().default(""),
    assigned_to: z.string().uuid().optional().nullable(),
    directors: z.array(directorSchema).max(3, "Maximum 3 directors").optional().default([])
})

// Types
export type CallingStatus = z.infer<typeof callingStatusEnum>
export type EligibilityStatus = z.infer<typeof eligibilityStatusEnum>
export type Director = z.infer<typeof directorSchema>
export type CompanyFormData = z.infer<typeof companyFormSchema>

// Display labels for enums
export const callingStatusLabels: Record<CallingStatus, string> = {
    queued: "Queued",
    picked_up: "Picked Up",
    not_answered: "Not Answered",
    not_contactable: "Not Contactable",
    interested: "Interested",
    not_interested: "Not Interested"
}

export const eligibilityStatusLabels: Record<EligibilityStatus, string> = {
    eligible: "Eligible",
    ineligible: "Ineligible",
    pending: "Pending"
}
