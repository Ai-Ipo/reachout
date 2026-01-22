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

export const boardTypeEnum = z.enum([
    "SME",
    "Main",
    "Other"
])

export const whatsappStatusEnum = z.enum([
    "not_sent",
    "sent",
    "delivered",
    "read",
    "replied",
    "failed"
])

// Director schema
export const directorSchema = z.object({
    id: z.string().uuid().optional(),
    din_no: z.string()
        .refine(val => val === "" || /^\d{8}$/.test(val), "DIN must be exactly 8 digits")
        .optional()
        .default(""),
    name: z.string().optional().default(""),
    contact_no: z.string()
        .refine(
            val => val === "" || /^[\d\s+()-]{10,}$/.test(val),
            "Must be a valid phone number (at least 10 digits)"
        )
        .optional()
        .default(""),
    email: z.string()
        .refine(val => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format")
        .optional()
        .default(""),
    email_status: emailStatusEnum.optional(),
    remark: z.string().max(500, "Remark must be 500 characters max").optional().default("")
})

// Company form schema (separate from DB schema for form handling)
export const companyFormSchema = z.object({
    id: z.string().uuid().optional(),
    internal_id: z.string().optional().default(""),
    city_id: z.string().min(1, "City is required"),
    name: z.string().min(2, "Company name must be at least 2 characters").max(200, "Company name must be 200 characters max"),
    financial_year: z.string().optional().default(""),
    turnover: z.string().optional().default(""),
    profit: z.string().optional().default(""),
    borrowed_funds: z.string().optional().default(""),
    loan_interest: z.string().optional().default(""),
    eligibility_status: eligibilityStatusEnum.default("pending"),
    board_type: boardTypeEnum.optional(),
    official_mail: z.string().optional().default(""),
    representative_name: z.string().max(100, "Name must be 100 characters max").optional().default(""),
    calling_status: callingStatusEnum.default("queued"),
    response: z.string().max(1000, "Response must be 1000 characters max").optional().default(""),
    whatsapp_status: whatsappStatusEnum.optional(),
    remarks: z.string().max(2000, "Remarks must be 2000 characters max").optional().default(""),
    website: z.string()
        .refine(val => val === "" || /^https?:\/\/.+\..+/.test(val), "Must be a valid URL (e.g., https://example.com)")
        .optional()
        .default(""),
    assigned_to: z.string().uuid().optional().nullable(),
    directors: z.array(directorSchema).max(3, "Maximum 3 directors").optional().default([])
})

// Types
export type CallingStatus = z.infer<typeof callingStatusEnum>
export type EligibilityStatus = z.infer<typeof eligibilityStatusEnum>
export type BoardType = z.infer<typeof boardTypeEnum>
export type WhatsappStatus = z.infer<typeof whatsappStatusEnum>
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

export const boardTypeLabels: Record<BoardType, string> = {
    SME: "SME Board",
    Main: "Main Board",
    Other: "Other"
}

export const whatsappStatusLabels: Record<WhatsappStatus, string> = {
    not_sent: "Not Sent",
    sent: "Sent",
    delivered: "Delivered",
    read: "Read",
    replied: "Replied",
    failed: "Failed"
}
