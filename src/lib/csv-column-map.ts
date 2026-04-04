/**
 * CSV column mapping for bulk company imports
 *
 * Supports both Tofler CSV exports and custom spreadsheet formats
 * All column matching is case-insensitive with whitespace normalization
 */

/**
 * Normalize a header for matching: trim, lowercase, collapse whitespace.
 * This eliminates trailing spaces, extra internal spaces, and casing mismatches.
 */
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ")
}

// All possible column names mapped to our database fields (normalized form)
// Order matters - first match wins for each target field
const COLUMN_ALIASES: Record<string, string> = {
  // Company Name (required)
  "company name": "name",
  "name of the company": "name",
  "company_name": "name",
  "name": "name",

  // Internal/Referral ID
  "referral code": "internal_id",
  "referral_code": "internal_id",
  "internal_id": "internal_id",

  // Financial Year
  "financial year": "financial_year",
  "financial_year": "financial_year",
  "fy": "financial_year",

  // Eligibility
  "eligibility": "eligibility_status",
  "eligibility_status": "eligibility_status",
  "eligible": "eligibility_status",

  // Profit fields
  "profit": "profit",
  "net profit": "profit",
  "profit before tax": "profit",
  "profit from continuing operations": "profit",
  "operating profit": "profit",
  "ebit": "profit",

  // Turnover/Revenue fields
  "turnover": "turnover",
  "sales": "turnover",
  "total income": "turnover",
  "revenue": "turnover",

  // Borrowed Funds
  "borrowed funds": "borrowed_funds",
  "borrowed_funds": "borrowed_funds",
  "total borrowings": "borrowed_funds",
  "totalborrrowings": "borrowed_funds",
  "long term borrowings": "borrowed_funds",
  "short term borrowings": "borrowed_funds",

  // Loan Interest (handle truncated "Loan intere")
  "loan interest": "loan_interest",
  "loan intere": "loan_interest",
  "finance costs": "loan_interest",
  "interest": "loan_interest",

  // Eligible Amount
  "eligible amount": "eligible_amount",
  "eligible_amount": "eligible_amount",
  "eligible amt": "eligible_amount",

  // Board Type
  "board": "board_type",
  "board_type": "board_type",
  "board type": "board_type",

  // Official Mail
  "official mail id": "official_mail",
  "official mail": "official_mail",
  "official_mail": "official_mail",
  "company email": "official_mail",

  // Calling Status
  "calling status": "calling_status",
  "calling_status": "calling_status",

  // Response
  "response (in detail if any)": "response",
  "response (if any)": "response",
  "response": "response",

  // WhatsApp Status
  "whatsapp status": "whatsapp_status",
  "whatsapp_status": "whatsapp_status",

  // Assigned To / Representative
  "assigned to": "assigned_to",
  "assigned_to": "assigned_to",
  "assigned": "assigned_to",
  "representative name": "assigned_to",
  "representative": "assigned_to",

  // Director 1
  "din 1": "director_1_din",
  "din no 1": "director_1_din",
  "director name 1": "director_1_name",
  "contact no 1": "director_1_contact",
  "email id 1": "director_1_email",

  // Director 2
  "din 2": "director_2_din",
  "din no 2": "director_2_din",
  "director name 2": "director_2_name",
  "contact no 2": "director_2_contact",
  "email id 2": "director_2_email",

  // Director 3
  "din 3": "director_3_din",
  "din no 3": "director_3_din",
  "director name 3": "director_3_name",
  "contact no 3": "director_3_contact",
  "email id 3": "director_3_email",
}

// Our database fields that can be populated from CSV (for display in preview)
export const DB_FIELDS = [
  "name",
  "internal_id",
  "financial_year",
  "eligibility_status",
  "board_type",
  "turnover",
  "profit",
  "borrowed_funds",
  "loan_interest",
  "eligible_amount",
  "official_mail",
  "calling_status",
  "whatsapp_status",
  "response",
  "assigned_to",
] as const

export type DBField = (typeof DB_FIELDS)[number]

// Director fields (not shown in main preview, but used in import)
export const DIRECTOR_FIELDS = [
  "director_1_din", "director_1_name", "director_1_contact", "director_1_email",
  "director_2_din", "director_2_name", "director_2_contact", "director_2_email",
  "director_3_din", "director_3_name", "director_3_contact", "director_3_email",
] as const

// Valid eligibility values
export const VALID_ELIGIBILITY = ["eligible", "ineligible", "pending"] as const

// Valid calling status values
export const VALID_CALLING_STATUS = [
  "queued",
  "callback",
  "not_answered",
  "not_contactable",
  "interested",
  "not_interested",
] as const

// Valid WhatsApp status values
export const VALID_WHATSAPP_STATUS = [
  "not_sent",
  "sent",
  "delivered",
  "read",
  "replied",
  "failed",
] as const

// Valid board types
export const VALID_BOARD_TYPES = ["SME", "Main", "Other"] as const

/**
 * Parse Indian currency format to number
 * Handles formats like: "24.0 lac", "63.7 cr", "0.0 k", "-62.1 lac", "425.7 CR"
 * - lac/lakh = 100,000 (1 lakh)
 * - cr/crore = 10,000,000 (1 crore)
 * - k = 1,000 (thousand)
 * Returns null if parsing fails
 */
export function parseIndianCurrency(value: string): number | null {
  if (!value || !value.trim()) return null

  const trimmed = value.trim().toLowerCase()

  // Handle "-" as null
  if (trimmed === "-" || trimmed === "") return null

  // Try to extract number and suffix
  const match = trimmed.match(/^(-?[\d.,]+)\s*(lac|lakh|cr|crore|k)?$/i)
  if (!match) {
    // Try parsing as plain number
    const plain = parseFloat(trimmed.replace(/,/g, ""))
    return isNaN(plain) ? null : plain
  }

  const numStr = match[1].replace(/,/g, "")
  const num = parseFloat(numStr)
  if (isNaN(num)) return null

  const suffix = match[2]?.toLowerCase()

  switch (suffix) {
    case "lac":
    case "lakh":
      return num * 100000 // 1 lakh = 100,000
    case "cr":
    case "crore":
      return num * 10000000 // 1 crore = 10,000,000
    case "k":
      return num * 1000 // 1k = 1,000
    default:
      return num // No suffix, return as is
  }
}

/**
 * Normalize calling status value
 */
function normalizeCallingStatus(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/\s+/g, "_")

  // Map common variations
  const statusMap: Record<string, string> = {
    "queued": "queued",
    "queue": "queued",
    "pending": "queued",
    "callback": "callback",
    "call_back": "callback",
    "picked_up": "callback",
    "not_answered": "not_answered",
    "no_answer": "not_answered",
    "not_contactable": "not_contactable",
    "unreachable": "not_contactable",
    "interested": "interested",
    "not_interested": "not_interested",
    "rejected": "not_interested",
  }

  return statusMap[trimmed] || (VALID_CALLING_STATUS.includes(trimmed as typeof VALID_CALLING_STATUS[number]) ? trimmed : null)
}

/**
 * Normalize board type value
 */
function normalizeBoardType(value: string): string | null {
  const trimmed = value.trim().toLowerCase()

  // Handle "Main Board" -> "Main"
  if (trimmed === "sme") return "SME"
  if (trimmed === "main" || trimmed === "main board") return "Main"
  if (trimmed === "other") return "Other"

  return null
}

export interface DirectorData {
  din_no?: string
  name?: string
  contact_no?: string
  email?: string
}

export interface MappedCompanyData {
  name: string | null
  internal_id: string | null
  financial_year: string | null
  eligibility_status: string
  board_type: string | null
  turnover: number | null
  profit: number | null
  borrowed_funds: number | null
  loan_interest: number | null
  eligible_amount: number | null
  official_mail: string | null
  calling_status: string
  whatsapp_status: string | null
  response: string | null
  assigned_to_name: string | null // Will be resolved to profile ID later
  directors: DirectorData[]
}

/**
 * Parse a CSV row into our database format
 * Returns null if company name is missing
 */
export function mapRowToCompany(
  row: Record<string, string>,
  columnMapping: Record<string, string>
): MappedCompanyData | null {
  const result: MappedCompanyData = {
    name: null,
    internal_id: null,
    financial_year: null,
    eligibility_status: "pending",
    board_type: null,
    turnover: null,
    profit: null,
    borrowed_funds: null,
    loan_interest: null,
    eligible_amount: null,
    official_mail: null,
    calling_status: "queued",
    whatsapp_status: null,
    response: null,
    assigned_to_name: null,
    directors: [],
  }

  // Temporary storage for director fields
  const directorData: Record<number, DirectorData> = {
    1: {},
    2: {},
    3: {},
  }

  // Map each CSV column to our fields
  for (const [csvColumn, value] of Object.entries(row)) {
    const dbField = columnMapping[csvColumn]
    if (!dbField || !value || !value.trim()) continue

    const trimmedValue = value.trim()

    // Handle director fields
    const directorMatch = dbField.match(/^director_(\d)_(din|name|contact|email)$/)
    if (directorMatch) {
      const dirNum = parseInt(directorMatch[1])
      const fieldType = directorMatch[2]

      if (fieldType === "din") directorData[dirNum].din_no = trimmedValue
      else if (fieldType === "name") directorData[dirNum].name = trimmedValue
      else if (fieldType === "contact") directorData[dirNum].contact_no = trimmedValue
      else if (fieldType === "email") directorData[dirNum].email = trimmedValue
      continue
    }

    // Handle regular fields
    switch (dbField) {
      case "name":
        result.name = trimmedValue
        break
      case "internal_id":
        result.internal_id = trimmedValue
        break
      case "financial_year":
        result.financial_year = trimmedValue
        break
      case "eligibility_status": {
        const normalized = trimmedValue.toLowerCase()
        if (VALID_ELIGIBILITY.includes(normalized as typeof VALID_ELIGIBILITY[number])) {
          result.eligibility_status = normalized
        }
        break
      }
      case "board_type": {
        const normalized = normalizeBoardType(trimmedValue)
        if (normalized) result.board_type = normalized
        break
      }
      case "official_mail":
        result.official_mail = trimmedValue
        break
      case "calling_status": {
        const normalized = normalizeCallingStatus(trimmedValue)
        if (normalized) result.calling_status = normalized
        break
      }
      case "whatsapp_status": {
        const normalized = trimmedValue.toLowerCase().replace(/\s+/g, "_")
        if (VALID_WHATSAPP_STATUS.includes(normalized as typeof VALID_WHATSAPP_STATUS[number])) {
          result.whatsapp_status = normalized
        }
        break
      }
      case "response":
        result.response = trimmedValue
        break
      case "assigned_to":
        result.assigned_to_name = trimmedValue
        break
      case "turnover":
      case "profit":
      case "borrowed_funds":
      case "loan_interest":
      case "eligible_amount":
        result[dbField] = parseIndianCurrency(trimmedValue)
        break
    }
  }

  // Collect non-empty directors
  for (let i = 1; i <= 3; i++) {
    const dir = directorData[i]
    if (dir.din_no || dir.name || dir.contact_no || dir.email) {
      result.directors.push(dir)
    }
  }

  // Name is required
  if (!result.name) {
    return null
  }

  return result
}

/**
 * Detect which CSV columns map to our fields.
 * Headers are normalized (trim, lowercase, collapse whitespace) before matching.
 * Returns the mapping (using original header keys for PapaParse compatibility)
 * and a list of column names that could not be mapped.
 */
export function detectColumnMapping(csvHeaders: string[]): {
  mapping: Record<string, string>
  unmappedColumns: string[]
} {
  const mapping: Record<string, string> = {}
  const usedFields = new Set<string>()
  const unmappedColumns: string[] = []

  for (const header of csvHeaders) {
    const normalized = normalizeHeader(header)
    const dbField = COLUMN_ALIASES[normalized]

    // For director fields, allow multiple (din, name, contact, email for each director)
    const isDirectorField = dbField?.startsWith("director_")

    // Only map if we haven't already mapped this field (first match wins)
    // Exception: director fields can all be mapped
    if (dbField && (isDirectorField || !usedFields.has(dbField))) {
      // Use the original header as key so it matches PapaParse row keys
      mapping[header] = dbField
      if (!isDirectorField) {
        usedFields.add(dbField)
      }
    } else if (!dbField) {
      unmappedColumns.push(header.trim())
    }
  }

  return { mapping, unmappedColumns }
}

/**
 * Check if required columns are present
 */
export function validateMapping(mapping: Record<string, string>): { valid: boolean; missing: string[] } {
  const mappedFields = new Set(Object.values(mapping))
  const missing: string[] = []

  if (!mappedFields.has("name")) {
    missing.push("Company Name")
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
