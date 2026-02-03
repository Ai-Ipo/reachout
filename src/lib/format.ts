// Format utilities for displaying financial data

/**
 * Format a number as Indian currency with appropriate unit (K, L, Cr)
 * @param value - The numeric value in rupees (raw value)
 * @returns Formatted string like "₹45.5 Cr", "₹97 L", "₹500 K"
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return "-"

    const absValue = Math.abs(value)
    const sign = value < 0 ? "-" : ""

    // 1 Crore = 10,000,000
    if (absValue >= 10000000) {
        return `${sign}₹${(absValue / 10000000).toFixed(2)} Cr`
    }
    // 1 Lakh = 100,000
    if (absValue >= 100000) {
        return `${sign}₹${(absValue / 100000).toFixed(2)} L`
    }
    // 1 Thousand = 1,000
    if (absValue >= 1000) {
        return `${sign}₹${(absValue / 1000).toFixed(2)} K`
    }
    // Small values - show as is
    if (absValue > 0) {
        return `${sign}₹${absValue.toLocaleString("en-IN")}`
    }
    return "₹0"
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
