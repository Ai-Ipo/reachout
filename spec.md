# Project Deliverables: IPO Outreach Collaboration Platform

## 1. Web Platform (The Dashboard)

### A. User Roles

- **Admin:** Full access to all data, filtering, and team management views.
- **Telemarketer:** Restricted access; can only view and update status for companies assigned specifically to them.

### B. Screens & Views

### **I. Admin Views (2 Main Screens)**

**Screen 1: The Data Hub (City & Company Management)**

- **Level 1: City Overview:** The landing view shows a breakdown/list of cities (locations).
- **Level 2: City Data Table:** Clicking a city reveals a master table of all companies in that location.
    - **Columns:** Displays all data fields (financials, directors, eligibility, etc.).
    - **Capabilities:** Full sorting (e.g., by Interest) and filtering (e.g., by Calling Status) on any column.
    - **Navigation:** Clicking a specific company opens the **Company Detail Page**.

**Screen 2: Team Management (Telemarketer Performance)**

- **Overview:** A breakdown organized by Telemarketer.
- **Details:** View which companies are assigned to which person, their current progress, and the status of leads under their management.

**Screen 3: User management**

- invite / remove telemarketers
### **II. Telemarketer View (1 Main Screen)**

**My Assignments**

- A single, simplified list view displaying only the companies assigned to the logged-in user.
- **Functionality:** Read-only access to company details; ability to edit "Status" and "Comments" only.

### **III. Company Detail Page (Accessible by both roles)**

- **Expanded Data:** A readable layout displaying all columns/information for a single company.
- **Website Preview:** An embedded Iframe displaying the company's live website.
- **Action Panel:**
    - **Status Update:** Dropdown for `Calling Status` (Picked up, Not Answered, Not Contactable).
    - **Remarks:** Text area for adding call notes.

### C. Data Management Features

- **Smart ID Generation:** System will auto-generate a unique Internal ID (Format: `{City_Short_Code}_{Number}`).
- **Deduplication:** Automatic check to prevent duplicate entries based on unique identifiers.
- **Data Fields:** The platform will support all columns from your workflow, including:
    - **Core Info:** Name, Financial Year, Turnover, Profit, Borrowed Funds.
    - **Eligibility:** Calculated Eligibility Status, Board Type.
    - **Directors:** DIN No, Name, Contact No, Email ID, Email Status.
    - **Tracking:** Calling Status, Response, Remarks. *(Whatsapp Status removed)*

## 2. Chrome Extension (Toffler Exporter)

A custom browser extension to automate data extraction.

- **Bulk Export:** Capabilities to scrape company data directly from Toffler search results.
- **Direct Sync:** "One-click" push to send extracted data directly into the Dashboard database.

## 3. Support & Maintenance

- **Post-Deployment:** Includes 1 month of dedicated maintenance and debugging to ensure platform stability.