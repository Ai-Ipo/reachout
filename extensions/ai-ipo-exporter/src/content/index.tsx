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

  // Find the header row and first th (checkbox column)
  const headerRow = table.querySelector('thead tr')
  if (!headerRow) {
    return
  }

  const firstTh = headerRow.querySelector('th')
  if (!firstTh) {
    return
  }

  // Create container for React component
  const container = document.createElement('div')
  container.id = CONTAINER_ID
  container.style.display = 'inline-flex'
  container.style.alignItems = 'center'
  container.style.marginLeft = '8px'

  // Insert after the checkbox in the first th
  firstTh.style.display = 'flex'
  firstTh.style.alignItems = 'center'
  firstTh.style.gap = '8px'
  firstTh.appendChild(container)

  // Render React component
  const root = createRoot(container)
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
