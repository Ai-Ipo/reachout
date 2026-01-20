// Format utilities for displaying financial data

/**
 * Format a number as Indian currency (Crores)
 * @param value - The numeric value in Crores
 * @returns Formatted string like "₹45.5 Cr"
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-"
    return `₹${value.toLocaleString("en-IN")} Cr`
}

/**
 * Format a number as percentage
 * @param value - The numeric value (e.g., 8.5 for 8.5%)
 * @returns Formatted string like "8.5%"
 */
export function formatPercent(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-"
    return `${value}%`
}

/**
 * Format a financial year string
 * @param value - Financial year like "2023-24"
 * @returns Formatted string like "FY 2023-24"
 */
export function formatFinancialYear(value: string | null | undefined): string {
    if (!value) return "-"
    return `FY ${value}`
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(text: string | null | undefined, maxLength: number = 30): string {
    if (!text) return "-"
    if (text.length <= maxLength) return text
    return `${text.slice(0, maxLength)}...`
}
