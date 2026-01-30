import { createRoot } from 'react-dom/client'
import { ExportButton } from './ExportButton'
import './styles.css'

const TABLE_ID = 'results-table'
const CONTAINER_ID = 'aiipo-export-container'

function injectExportButton() {
  // Check if already injected
  if (document.getElementById(CONTAINER_ID)) {
    return
  }

  // Find the results table
  const table = document.getElementById(TABLE_ID) as HTMLTableElement | null
  if (!table) {
    return
  }

  // Find the header row
  const headerRow = table.querySelector('thead tr')
  if (!headerRow) {
    return
  }

  // Create a new th element for the export button
  const exportTh = document.createElement('th')
  exportTh.id = CONTAINER_ID
  exportTh.style.width = 'auto'
  exportTh.style.padding = '8px'
  exportTh.style.verticalAlign = 'middle'

  // Insert as the second th (after checkbox column)
  const firstTh = headerRow.querySelector('th')
  if (firstTh && firstTh.nextSibling) {
    headerRow.insertBefore(exportTh, firstTh.nextSibling)
  } else {
    headerRow.appendChild(exportTh)
  }

  // Also add empty td to each body row to maintain column alignment
  const bodyRows = table.querySelectorAll('tbody tr')
  bodyRows.forEach(row => {
    const emptyTd = document.createElement('td')
    emptyTd.style.width = 'auto'
    const firstTd = row.querySelector('td')
    if (firstTd && firstTd.nextSibling) {
      row.insertBefore(emptyTd, firstTd.nextSibling)
    } else {
      row.appendChild(emptyTd)
    }
  })

  // Render React component
  const root = createRoot(exportTh)
  root.render(<ExportButton table={table} />)

  console.log('[AI IPO Exporter] Export button injected')
}

// Run when DOM is ready
function init() {
  // Try immediately
  injectExportButton()

  // Also watch for dynamic table loading
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const table = document.getElementById(TABLE_ID)
        if (table && !document.getElementById(CONTAINER_ID)) {
          injectExportButton()
          break
        }
      }
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
