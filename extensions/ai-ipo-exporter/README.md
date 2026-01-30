# AI IPO Exporter - Chrome Extension

Export table data from Tofler to CSV with one click.

## Features

- Adds an "Export" button next to the select-all checkbox in Tofler's results table
- Exports all visible columns (dynamically detected)
- Smart export: if rows are selected, exports only those; otherwise exports all
- Downloads data as CSV file with timestamp

## Installation

### Development / Manual Install

1. **Build the extension:**
   ```bash
   cd extensions/ai-ipo-exporter
   pnpm install
   pnpm build
   ```

2. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extensions/ai-ipo-exporter/dist` folder

3. **Add your icon:**
   - Place your `icon.png` (128x128 recommended) in `extensions/ai-ipo-exporter/public/`
   - Rebuild with `pnpm build`

## Development

```bash
# Watch mode - rebuilds on changes
pnpm dev

# One-time build
pnpm build

# Type check
pnpm typecheck
```

After making changes, go to `chrome://extensions/` and click the refresh icon on the extension.

## Usage

1. Go to [Tofler](https://www.tofler.in) and search for companies
2. The "Export" button will appear in the table header
3. **To export all rows:** Click "Export" without selecting any rows
4. **To export specific rows:** Check the rows you want, then click "Export"

## File Structure

```
ai-ipo-exporter/
├── dist/                   # Built extension (load this in Chrome)
├── public/
│   └── icon.png           # Extension icon (PLACEHOLDER - replace with your own)
├── src/
│   ├── content/
│   │   ├── index.tsx      # Content script entry
│   │   ├── ExportButton.tsx
│   │   └── styles.css
│   └── utils/
│       └── csv.ts         # CSV generation
├── manifest.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Icon Setup

**Required:** Add your logo as `public/icon.png` before building.

```
extensions/ai-ipo-exporter/public/icon.png  <-- PUT YOUR ICON HERE
```

- Recommended size: 128x128 pixels
- Format: PNG with transparency
- Will be used for all icon sizes (16, 48, 128)
