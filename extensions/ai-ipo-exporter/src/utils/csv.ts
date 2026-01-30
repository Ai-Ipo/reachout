/**
 * Escapes a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Escapes quotes by doubling them
 */
function escapeCSVValue(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value)
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Converts table data to CSV string
 */
export function tableToCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCSVValue).join(',')
  const dataLines = rows.map(row => row.map(escapeCSVValue).join(','))
  return [headerLine, ...dataLines].join('\n')
}

/**
 * Downloads a CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Extracts data from the Tofler results table
 * @param onlySelected - If true, only export checked rows
 */
export function extractTableData(table: HTMLTableElement, onlySelected: boolean): {
  headers: string[]
  rows: string[][]
  totalRows: number
  selectedRows: number
} {
  const headers: string[] = []
  const rows: string[][] = []

  // Get headers from thead > tr > th
  const headerRow = table.querySelector('thead tr')
  if (headerRow) {
    const ths = headerRow.querySelectorAll('th')
    ths.forEach((th, index) => {
      // Skip first column (checkbox)
      if (index === 0) return
      // Get inner text, trim whitespace
      const text = th.innerText.trim()
      headers.push(text)
    })
  }

  // Get data rows from tbody > tr
  const tbody = table.querySelector('tbody')
  if (tbody) {
    const trs = tbody.querySelectorAll('tr')
    let selectedCount = 0

    trs.forEach(tr => {
      const checkbox = tr.querySelector('td:first-child input[type="checkbox"]') as HTMLInputElement
      const isChecked = checkbox?.checked ?? false

      if (isChecked) selectedCount++

      // If onlySelected is true, skip unchecked rows
      if (onlySelected && !isChecked) return

      const rowData: string[] = []
      const tds = tr.querySelectorAll('td')

      tds.forEach((td, index) => {
        // Skip first column (checkbox)
        if (index === 0) return

        // For company name column, try to get full name from data-tooltip or anchor text
        const anchor = td.querySelector('a')
        if (anchor) {
          // Prefer data-tooltip for full company name
          const fullName = anchor.getAttribute('data-tooltip')
          rowData.push(fullName || anchor.innerText.trim())
        } else {
          rowData.push(td.innerText.trim())
        }
      })

      rows.push(rowData)
    })

    return {
      headers,
      rows,
      totalRows: trs.length,
      selectedRows: selectedCount,
    }
  }

  return { headers, rows, totalRows: 0, selectedRows: 0 }
}
