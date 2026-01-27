import type { UserRole } from "@/components/auth-provider"

/**
 * Fields that telemarketers are allowed to edit.
 * Admin can edit all fields.
 *
 * To modify telemarketer permissions, add or remove fields from this array.
 */
export const TELEMARKETER_EDITABLE_FIELDS = [
    "calling_status",
    "whatsapp_status",
    "response",
    "remarks",
] as const

export type TelemarketerEditableField = typeof TELEMARKETER_EDITABLE_FIELDS[number]

/**
 * Check if a user with the given role can edit a specific field
 */
export function canEditField(role: UserRole | undefined, field: string): boolean {
    if (!role) return false
    if (role === "admin") return true
    return TELEMARKETER_EDITABLE_FIELDS.includes(field as TelemarketerEditableField)
}

/**
 * Check if a user with the given role can edit company data (any field)
 */
export function canEditCompany(role: UserRole | undefined): boolean {
    return role === "admin" || role === "telemarketer"
}

/**
 * Check if user is admin
 */
export function isAdminRole(role: UserRole | undefined): boolean {
    return role === "admin"
}

/**
 * Fields that are admin-only (telemarketers see as read-only)
 */
export const ADMIN_ONLY_FIELDS = [
    "name",
    "financial_year",
    "turnover",
    "profit",
    "borrowed_funds",
    "loan_interest",
    "eligibility_status",
    "board_type",
    "official_mail",
    "website",
    "assigned_to",
    "directors",
] as const
