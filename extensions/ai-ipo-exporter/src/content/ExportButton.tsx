import { useState, useEffect, useCallback } from 'react'
import { extractTableData, tableToCSV, downloadCSV } from '../utils/csv'

interface ExportButtonProps {
  table: HTMLTableElement
}

export function ExportButton({ table }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [rowInfo, setRowInfo] = useState({ total: 0, selected: 0 })

  // Update row count info
  const updateRowInfo = useCallback(() => {
    const tbody = table.querySelector('tbody')
    if (tbody) {
      const trs = tbody.querySelectorAll('tr')
      let selected = 0
      trs.forEach(tr => {
        const checkbox = tr.querySelector('td:first-child input[type="checkbox"]') as HTMLInputElement
        if (checkbox?.checked) selected++
      })
      setRowInfo({ total: trs.length, selected })
    }
  }, [table])

  // Listen for checkbox changes
  useEffect(() => {
    updateRowInfo()

    // Watch for checkbox changes
    const observer = new MutationObserver(updateRowInfo)
    observer.observe(table, {
      subtree: true,
      attributes: true,
      attributeFilter: ['checked']
    })

    // Also listen for click events on checkboxes
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
        setTimeout(updateRowInfo, 10)
      }
    }
    table.addEventListener('click', handleClick)

    return () => {
      observer.disconnect()
      table.removeEventListener('click', handleClick)
    }
  }, [table, updateRowInfo])

  const handleExport = () => {
    setIsExporting(true)

    try {
      // If any rows are selected, export only those; otherwise export all
      const onlySelected = rowInfo.selected > 0
      const { headers, rows } = extractTableData(table, onlySelected)

      if (rows.length === 0) {
        alert('No data to export')
        return
      }

      const csv = tableToCSV(headers, rows)
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `tofler-export-${timestamp}.csv`

      downloadCSV(csv, filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportCount = rowInfo.selected > 0 ? rowInfo.selected : rowInfo.total
  const tooltipText = rowInfo.selected > 0
    ? `Export ${rowInfo.selected} selected rows`
    : `Export all ${rowInfo.total} rows`

  return (
    <button
      className="aiipo-export-btn"
      onClick={handleExport}
      disabled={isExporting || rowInfo.total === 0}
      title={tooltipText}
    >
      <span className="aiipo-export-btn-bg" />
      <span className="aiipo-export-btn-content">
        {isExporting ? (
          <svg className="aiipo-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        <span>Export{exportCount > 0 ? ` (${exportCount})` : ''}</span>
      </span>
    </button>
  )
}
