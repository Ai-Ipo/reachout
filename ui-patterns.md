# Refix Sentinel: UI/UX Architecture & Design

> [!IMPORTANT]
> **COLOR RULE**: Never use direct Tailwind colors (e.g., `bg-blue-500`, `text-red-500`). ALWAYS use the semantic CSS variables defined in global.css (e.g., `bg-primary`, `text-destructive`).

**Goal**: Transform the `CONTROL_PLANE_SPEC.md` into a concrete set of Next.js Pages and Components.
**Theme**: "Technical & Dense" (Data-heavy, low whitespace, high utility).

---

## 1. Global Layout (`app/layout.tsx`)
*   **Sidebar Navigation**: Global Context.
    *   `[Icon] Mission Control` (Home)
    *   `[Icon] Fleet Ops` (Global Releases)
    *   `[Icon] Settings` (Global Config)
*   **Top Bar**:
    *   **breadcrumbs**: `Mission Control > Acme Corp > Infrastructure`
    *   **User Profile**: `dankre@refix.ai` (Logout)
    *   **Theme Toggle**: Light/Dark

---

## 2. Page: Mission Control (`app/page.tsx`)
**The "Morning Coffee" View.** High-level pulse of the entire business.

### A. The Tenant Grid
A responsive grid of **Tenant Cards**.

#### **Component: `TenantCard`**
| Section | Content | Visual |
| :--- | :--- | :--- |
| **Header** | **Tenant Name** (`Acme Corp`) | Bold, Large |
| **Health** | **Health Score** (`98/100`) | Circular Progress (Green/Yellow/Red) |
| **Meta** | `Plan: Enterprise`, `Created: 2m ago` | Badge, Muted Text |
| **Infra** | `Pod: Running`, `DB: Healthy` | Status Dots (Green/Red) |
| **Version** | `v1.2.0` (Deployed: `2d ago`) | Monospace Tag |
| **Metrics** | `2.4k Msgs/day`, `$45.20 Est. Cost` | Sparkline or Mini-Stat |

### B. Global Aggregates (Header Area)
*   **Total Active Tenants**: `12`
*   **Global Error Rate**: `0.05%`
*   **Total AI Spend (MTD)**: `$1,240.50`

---

## 3. Page: Tenant Workspace (`app/tenants/[slug]/page.tsx`)
**Default View**: This routes to **Infrastructure** (as requested).

### **Tenant Layout (`app/tenants/[slug]/layout.tsx`)**
*   **Sidebar Context Switch**: When inside a tenant, the Sidebar adds a "Tenant Context" section or submenu.
*   **Tabs**: `Infrastructure`, `Business/CRM`, `Debug Console`, `Configuration`, `Integrations`.

### **Tab 1: Infrastructure Dashboard (Default)**
*Focus: Is it running?*
1.  **Pod Fleet Status**:
    *   Row for `Orchestrator`, `Redis`, `TimescaleDB`.
    *   Columns: `Status` (Running), `Restarts` (0), `Memory` (400MB), `Version` (v1.2.0).
    *   **Action**: `[Restart]` button (Destructive).
2.  **Queue Health (BullMQ)**:
    *   Metrics: `Waiting`, `Active`, `Delayed`, `Failed`.
    *   **Action**: `[Retry Failed]` button.
    *   **Action**: `[Flush Queue]` button.
3.  **Migrations**:
    *   Status: `Up to Date` (Migration ID: `004_add_users`).
    *   **Action**: `[Run Migration job]` button.

### **Tab 2: Business & CRM (`/crm`)**
*Focus: Are they happy?*
1.  **Usage Charts**:
    *   `Message Volume` (Bar Chart - last 30d).
    *   `Active Users` (Line Chart - DAU).
2.  **Billing**:
    *   `AI Cost Estimator` breakdown by Model (`gpt-4`, `claude-3`).
3.  **Plan Management**:
    *   Current Plan: `Enterprise`.
    *   **Action**: `[Edit Plan]` (Update DB).

### **Tab 3: Integrations (`/integrations`)**
*Focus: Are they connected?*
1.  **Integration Grid**: `Mixpanel`, `Salesforce`, `Slack`.
2.  **Status**: `Active`, `Error`, or `Pending Auth`.
3.  **Internal Actions**:
    *   `[Force Sync]` (Trigger sync job).
    *   `[Validate Creds]` (Check refresh token).

### **Tab 4: Debug Console (`/explorer`)**
*Focus: Why did it break?*
1.  **Trace Explorer**:
    *   Table of recent Orchestrator Jobs.
    *   Cols: `Job ID`, `Workflow`, `Status`, `Duration`, `Trace Link`.
    *   **Action**: Click row -> Opens Side Sheet with job details & specific LangSmith URL.
2.  **Impersonation**:
    *   Magic Button: `[Generate Magic Login Link]` -> Copies URL to clipboard.

### **Tab 5: Configuration (`/config`)**
*Focus: Feature Flags & Secrets*
1.  **JSON Editor**:
    *   Read/Write access to the `tenant_config` JSON column.
    *   Schema Validation (Refix SDK schemas).
2.  **Feature Flags**:
    *   Toggles: `Enable Beta Agent`, `Enable GPT-5`.
3.  **Secrets Manager**:
    *   UI to patch Kubernetes Secrets (e.g. `OPENAI_API_KEY` override).

---

## 4. Component Dictionary (Shadcn)
*   **Charts**: `Recharts` (via Shadcn Charts).
*   **Tables**: `TanStack Table` (for Job lists, Tenant lists).
*   **Editors**: `Monaco Editor` or simple `Textarea` for Config.
*   **Icons**: `Lucide React`.
*   **Notifications**: `Sonner`.
