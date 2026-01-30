/**
 * Static column mapping from Tofler CSV exports to our database fields
 *
 * Tofler columns are mapped to our schema:
 * - name (required)
 * - eligibility_status
 * - turnover
 * - profit
 * - borrowed_funds
 * - loan_interest
 */

// All possible Tofler column names mapped to our database fields
// Order matters - first match wins for each target field
export const TOFLER_COLUMN_MAP: Record<string, string> = {
  // Company Name (required) - always present in Tofler
  "Company Name": "name",

  // Eligibility - added by user in Sheets
  "Eligibility": "eligibility_status",
  "eligibility_status": "eligibility_status",
  "eligibility": "eligibility_status",
  "Eligible": "eligibility_status",

  // Profit fields
  "Net Profit": "profit",
  "Profit Before Tax": "profit",
  "Profit from Continuing Operations": "profit",
  "Operating Profit": "profit",
  "EBIT": "profit",

  // Turnover/Revenue fields
  "Sales": "turnover",
  "Total Income": "turnover",

  // Borrowed Funds
  "Total Borrowings": "borrowed_funds",
  "TotalBorrowings": "borrowed_funds",
  "Long Term Borrowings": "borrowed_funds",
  "Short Term Borrowings": "borrowed_funds",

  // Loan Interest
  "Finance Costs": "loan_interest",
}

// Our database fields that can be populated from CSV
export const DB_FIELDS = ["name", "eligibility_status", "turnover", "profit", "borrowed_funds", "loan_interest"] as const

export type DBField = typeof DB_FIELDS[number]

// Valid eligibility values
export const VALID_ELIGIBILITY = ["eligible", "ineligible", "pending"] as const

/**
 * Parse a CSV row into our database format
 * Returns null if company name is missing
 */
export function mapRowToCompany(
  row: Record<string, string>,
  columnMapping: Record<string, string>
): Record<string, string | null> | null {
  const result: Record<string, string | null> = {
    name: null,
    eligibility_status: "pending", // default
    turnover: null,
    profit: null,
    borrowed_funds: null,
    loan_interest: null,
  }

  // Map each CSV column to our fields
  for (const [csvColumn, value] of Object.entries(row)) {
    const dbField = columnMapping[csvColumn]
    if (dbField && value && value.trim()) {
      if (dbField === "eligibility_status") {
        // Normalize eligibility value
        const normalized = value.trim().toLowerCase()
        if (VALID_ELIGIBILITY.includes(normalized as any)) {
          result[dbField] = normalized
        }
      } else {
        result[dbField] = value.trim()
      }
    }
  }

  // Name is required
  if (!result.name) {
    return null
  }

  return result
}

/**
 * Detect which CSV columns map to our fields
 * Returns a mapping of CSV column name -> our field name
 */
export function detectColumnMapping(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const usedFields = new Set<string>()

  for (const header of csvHeaders) {
    const trimmedHeader = header.trim()
    const dbField = TOFLER_COLUMN_MAP[trimmedHeader]

    // Only map if we haven't already mapped this field (first match wins)
    if (dbField && !usedFields.has(dbField)) {
      mapping[trimmedHeader] = dbField
      usedFields.add(dbField)
    }
  }

  return mapping
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
