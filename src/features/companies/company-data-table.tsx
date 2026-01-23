"use client"

import { useState, useMemo, useCallback, useRef, useLayoutEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    flexRender,
    type ColumnDef,
    type SortingState,
    type RowSelectionState,
    type ColumnFiltersState,
    type VisibilityState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { DirectorCell } from "./director-cell"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { QuickStatusSelect } from "./quick-status-select"
import { QuickEligibilitySelect } from "./quick-eligibility-select"
import { QuickWhatsappSelect } from "./quick-whatsapp-select"
import { QuickBoardSelect } from "./quick-board-select"
import { QuickAssignSelect } from "./quick-assign-select"
import { formatCurrency, formatPercent, formatFinancialYear } from "@/lib/format"
import { ArrowUpDown, Plus, Type, Hash, Building2, Users, Mail, Phone, Settings2, ExternalLink, MapPin } from "lucide-react"
import { BulkActionBar, BulkAssignDialog, BulkDeleteDialog } from "./bulk-actions"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CompanyTableToolbar } from "./company-table-toolbar"

export interface Director {
    id: string
    din_no?: string
    name?: string
    contact_no?: string
    email?: string
    email_status?: string
    remark?: string
}

export interface AssignedProfile {
    id: string
    full_name: string | null
    email: string | null
    image_url: string | null
}

export interface CityInfo {
    id: string
    name: string
    short_code: string
}

export interface Company {
    id: string
    internal_id: string
    city_id: string
    city?: CityInfo | null
    name: string
    financial_year?: string
    turnover?: number
    profit?: number
    borrowed_funds?: number
    loan_interest?: number
    eligibility_status: string
    board_type?: string
    official_mail?: string
    calling_status: string
    response?: string
    whatsapp_status?: string
    remarks?: string
    website?: string
    assigned_to?: string | null
    assigned_profile?: AssignedProfile | null
    directors: Director[]
}

interface CompanyDataTableProps {
    cityId?: string
    assignedTo?: string // Filter by telemarketer profile ID
    eligibilityStatus?: "pending" | "eligible" | "ineligible" // Filter by eligibility
    callingStatusIn?: string[] // Filter by calling_status IN these values
    onAddCompany?: () => void
    refreshKey?: number
    onEditCompany?: (company: Company | null) => void
    hideAssignColumn?: boolean // Hide the assign column when viewing a specific telemarketer
    hideAddButton?: boolean // Hide the add button in footer
    showCityColumn?: boolean // Show city column (for "All Cities" view)
}

const TruncatedTooltipCell = ({ value, className }: { value: string | null | undefined, className?: string }) => {
    const [isTruncated, setIsTruncated] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)

    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return

        const checkTruncation = () => {
            if (element) {
                // Use a small threshold for sub-pixel rendering differences
                setIsTruncated(element.scrollWidth > element.clientWidth + 0.5)
            }
        }

        const observer = new ResizeObserver(checkTruncation)
        observer.observe(element)
        // Check immediately and on next frame to ensure layout is settled
        checkTruncation()
        requestAnimationFrame(checkTruncation)

        return () => observer.disconnect()
    }, [value])

    if (!value) return <span className="text-muted-foreground">-</span>

    const content = (
        <span
            ref={ref}
            className={cn("truncate block w-full cursor-default min-w-0", className)}
        >
            {value}
        </span>
    )

    if (!isTruncated) return content

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {content}
            </TooltipTrigger>
            <TooltipContent>
                <p className="max-w-[300px] break-words text-xs">{value}</p>
            </TooltipContent>
        </Tooltip>
    )
}

export function CompanyDataTable({ cityId, assignedTo, eligibilityStatus, callingStatusIn, onAddCompany, refreshKey, onEditCompany, hideAssignColumn, hideAddButton, showCityColumn }: CompanyDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        const visibility: VisibilityState = {}
        if (hideAssignColumn) visibility.assigned_to = false
        if (!showCityColumn) visibility.city = false
        return visibility
    })
    const [globalFilter, setGlobalFilter] = useState("")
    const [pageSize, setPageSize] = useState(50)
    const [internalRefreshKey, setInternalRefreshKey] = useState(0)

    // Bulk Action State
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const { getToken } = useAuth()

    // Define type for SWR data
    type CompaniesData = { companies: Company[]; totalCount: number }

    // Fetch companies using SWR
    const fetchCompanies = useCallback(async (): Promise<CompaniesData> => {
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        let query = supabase
            .from("companies")
            .select(`
                id,
                internal_id,
                city_id,
                city:cities(id, name, short_code),
                name,
                financial_year,
                turnover,
                profit,
                borrowed_funds,
                loan_interest,
                eligibility_status,
                board_type,
                official_mail,
                calling_status,
                response,
                whatsapp_status,
                remarks,
                website,
                assigned_to,
                assigned_profile:profiles!assigned_to(id, full_name, email, image_url),
                directors(id, din_no, name, contact_no, email, email_status, remark)
            `, { count: "exact" })

        // Apply filters based on provided props
        if (cityId) {
            query = query.eq("city_id", cityId)
        }
        if (assignedTo) {
            query = query.eq("assigned_to", assignedTo)
        }
        if (eligibilityStatus) {
            query = query.eq("eligibility_status", eligibilityStatus)
        }
        if (callingStatusIn && callingStatusIn.length > 0) {
            query = query.in("calling_status", callingStatusIn)
        }

        const { data, error, count } = await query.order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching companies:", error)
            throw error
        }

        // Transform data to handle Supabase returning relations as arrays
        const transformed: Company[] = (data || []).map(company => ({
            ...company,
            city: Array.isArray(company.city)
                ? company.city[0] || null
                : company.city || null,
            assigned_profile: Array.isArray(company.assigned_profile)
                ? company.assigned_profile[0] || null
                : company.assigned_profile || null
        })) as Company[]

        return { companies: transformed, totalCount: count || 0 }
    }, [cityId, assignedTo, eligibilityStatus, callingStatusIn, getToken])

    // SWR key based on filters
    const swrKey = cityId || assignedTo || eligibilityStatus || callingStatusIn || showCityColumn
        ? ['companies', cityId, assignedTo, eligibilityStatus, callingStatusIn?.join(','), refreshKey, internalRefreshKey]
        : null

    const { data, isLoading, mutate } = useSWR<CompaniesData>(
        swrKey,
        fetchCompanies,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    )

    const companies: Company[] = data?.companies || []
    const totalCount = data?.totalCount || 0

    // Optimistic update helper - updates companies locally via SWR
    const updateCompanyField = useCallback((companyId: string, field: keyof Company, value: unknown) => {
        if (!data) return
        const updatedCompanies = data.companies.map(c =>
            c.id === companyId ? { ...c, [field]: value } : c
        )
        mutate({ ...data, companies: updatedCompanies as typeof data.companies }, { revalidate: false })
    }, [mutate, data])

    // Update assigned profile optimistically
    const updateAssignedProfile = useCallback((companyId: string, profile: AssignedProfile | null) => {
        if (!data) return
        const updatedCompanies = data.companies.map(c =>
            c.id === companyId
                ? { ...c, assigned_to: profile?.id || null, assigned_profile: profile }
                : c
        )
        mutate({ ...data, companies: updatedCompanies as typeof data.companies }, { revalidate: false })
    }, [mutate, data])

    // Column definitions - Notion-style with semantic colors
    const columns = useMemo<ColumnDef<Company>[]>(() => [
        {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                        className="border-border"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                        className="border-border"
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },

        {
            accessorKey: "internal_id",
            header: () => (
                <div className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span>ID</span>
                </div>
            ),
            cell: ({ row }) => (
                <Link
                    href={`/admin/companies/${row.original.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-muted-foreground/50"
                    onClick={(e) => e.stopPropagation()}
                >
                    {row.getValue("internal_id") || "-"}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                </Link>
            ),
            size: 100,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <Type className="h-3 w-3 text-muted-foreground" />
                    <span>Company Name</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => {
                const name = row.getValue("name") as string
                return (
                    <Link
                        href={`/admin/companies/${row.original.id}`}
                        target="_blank"
                        className="group inline-flex items-center gap-1 max-w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="font-medium text-foreground underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-muted-foreground/50 truncate">
                            {name}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0 text-muted-foreground" />
                    </Link>
                )
            },
            size: 200,
            minSize: 100,
            enableHiding: false,
        },
        {
            id: "city",
            accessorFn: (row) => row.city?.name,
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>City</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-xs">
                    {row.original.city?.name || "-"}
                </span>
            ),
            size: 100,
        },
        {
            accessorKey: "financial_year",
            header: ({ column }) => (
                <button
                    className="flex items-center w-18 gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span>FY</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-xs">
                    {formatFinancialYear(row.getValue("financial_year"))}
                </span>
            ),
            size: 100,
        },
        {
            accessorKey: "turnover",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span>Turnover</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-xs">
                    {formatCurrency(row.getValue("turnover"))}
                </span>
            ),
            size: 100,
        },
        {
            accessorKey: "profit",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span>Profit</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-xs">
                    {formatCurrency(row.getValue("profit"))}
                </span>
            ),
            size: 90,
        },
        {
            accessorKey: "borrowed_funds",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span>Funds</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-xs">
                    {formatCurrency(row.getValue("borrowed_funds"))}
                </span>
            ),
            size: 90,
        },
        {
            accessorKey: "loan_interest",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span className="text-xs">Interest</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-xs">
                    {formatPercent(row.getValue("loan_interest"))}
                </span>
            ),
            size: 70,
        },
        {
            accessorKey: "eligibility_status",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span>Eligibility</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("eligibility_status") as string
                return (
                    <QuickEligibilitySelect
                        companyId={row.original.id}
                        currentStatus={status as "eligible" | "ineligible" | "pending"}
                        onOptimisticUpdate={(newStatus) => updateCompanyField(row.original.id, "eligibility_status", newStatus)}
                    />
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
            size: 90,
        },
        {
            accessorKey: "board_type",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span>Board</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => {
                const boardType = row.getValue("board_type") as string | null
                return (
                    <QuickBoardSelect
                        companyId={row.original.id}
                        currentType={boardType as "SME" | "Main" | "Other" | null}
                        onOptimisticUpdate={(newType) => updateCompanyField(row.original.id, "board_type", newType)}
                    />
                )
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id)
                // Filter value is array of strings.
                // If filter includes rowValue, return true.
                if (rowValue === null || rowValue === undefined) return false
                return value.includes(rowValue)
            },
            size: 80,
        },
        {
            id: "directors",
            header: () => (
                <div className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>Directors</span>
                </div>
            ),
            cell: ({ row }) => <DirectorCell directors={row.original.directors} />,
            size: 90,
        },
        {
            accessorKey: "official_mail",
            header: () => (
                <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>Email</span>
                </div>
            ),
            cell: ({ row }) => (
                <TruncatedTooltipCell value={row.getValue("official_mail")} className="text-xs text-muted-foreground" />
            ),
            size: 130,
            minSize: 80,
        },
        {
            accessorKey: "assigned_to",
            header: "Assigned",
            cell: ({ row }) => (
                <QuickAssignSelect
                    companyId={row.original.id}
                    currentAssignment={row.original.assigned_profile || null}
                    onOptimisticUpdate={(profile) => updateAssignedProfile(row.original.id, profile)}
                />
            ),
            filterFn: (row, id, value) => {
                // value is array of strings (user IDs or "unassigned")
                const rowValue = row.getValue(id)
                if (!rowValue) {
                    return value.includes("unassigned")
                }
                return value.includes(rowValue)
            },
            size: 120,
        },
        {
            accessorKey: "calling_status",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>Status</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("calling_status") as string
                return (
                    <QuickStatusSelect
                        companyId={row.original.id}
                        currentStatus={status as "queued" | "callback" | "not_answered" | "not_contactable" | "interested" | "not_interested"}
                        onOptimisticUpdate={(newStatus) => updateCompanyField(row.original.id, "calling_status", newStatus)}
                    />
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
            size: 100,
        },
        {
            accessorKey: "response",
            header: "Response",
            cell: ({ row }) => (
                <TruncatedTooltipCell value={row.getValue("response")} className="text-xs text-muted-foreground" />
            ),
            size: 100,
            minSize: 100,
        },
        {
            accessorKey: "whatsapp_status",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    <span className="text-[10px]">WhatsApp</span>
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
                </button>
            ),
            cell: ({ row }) => {
                const status = row.getValue("whatsapp_status") as string | null
                return (
                    <QuickWhatsappSelect
                        companyId={row.original.id}
                        currentStatus={status as "not_sent" | "sent" | "delivered" | "read" | "replied" | "failed" | null}
                        onOptimisticUpdate={(newStatus) => updateCompanyField(row.original.id, "whatsapp_status", newStatus)}
                    />
                )
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id)
                // Filter by array inclusions
                if (rowValue === null || rowValue === undefined) return false
                return value.includes(rowValue)
            },
            size: 80,
        },
    ], [updateCompanyField, updateAssignedProfile])

    // Table instance
    const table = useReactTable({
        data: companies,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        columnResizeMode: "onChange",
        state: {
            sorting,
            rowSelection,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
        defaultColumn: {
            minSize: 50,
            maxSize: 500,
        },
    })

    const selectedCount = Object.keys(rowSelection).length
    const filteredCount = table.getFilteredRowModel().rows.length

    // Handle edit panel close and refresh
    const handleEditSuccess = useCallback(() => {
        setInternalRefreshKey(k => k + 1)
    }, [])

    const handleRowClick = useCallback((company: Company, event: React.MouseEvent) => {
        // Don't open edit if clicking on calling cell, checkbox or interactive elements
        const target = event.target as HTMLElement
        if (
            target.closest('input[type="checkbox"]') ||
            target.closest('button') ||
            target.closest('[role="checkbox"]')
        ) {
            return
        }
        onEditCompany?.(company)
    }, [onEditCompany])


    if (isLoading) {
        return (
            <div className="space-y-0">
                {/* Skeleton header */}
                <div className="h-9 bg-muted/30 border-b border-border" />
                {/* Skeleton rows */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-9 border-b border-border/50 flex items-center px-3 gap-4">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-6" />
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="flex relative h-full">
            <div className="flex-1 min-w-0">
                <div className="space-y-0">
                    {/* Top Toolbar - Clean & Notion-like */}
                    <CompanyTableToolbar
                        table={table}
                        totalCount={totalCount}
                        onAddCompany={onAddCompany}
                    />

                    {/* Table - Notion style */}
                    <div className="border border-border overflow-x-auto rounded-sm bg-background max-w-[calc(100vw-16rem)]">
                        <table
                            className="text-sm border-collapse table-fixed"
                            style={{ width: table.getTotalSize() }}
                        >
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                style={{ width: header.getSize() }}
                                                className="h-9 px-2 text-left text-[13px] font-normal text-muted-foreground border-r border-border last:border-r-0 select-none relative group"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.getCanResize() && (
                                                    <div
                                                        onMouseDown={header.getResizeHandler()}
                                                        onTouchStart={header.getResizeHandler()}
                                                        className={cn(
                                                            "absolute right-0 top-0 h-full w-1 bg-border/50 cursor-col-resize touch-none select-none opacity-0 group-hover:opacity-100 transition-opacity",
                                                            header.column.getIsResizing() && "bg-primary opacity-100 w-1.5"
                                                        )}
                                                    />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            onClick={(e) => handleRowClick(row.original, e)}
                                            className={cn(
                                                "group border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer",
                                                "data-[state=selected]:bg-primary/10"
                                            )}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    style={{ width: cell.column.getSize() }}
                                                    className="h-9 px-2 border-r border-border/50 last:border-r-0 text-[13px] text-foreground data-[state=selected]:border-primary/20 overflow-hidden"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="h-24 text-center text-muted-foreground text-sm"
                                        >
                                            No companies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Notion-like Footer */}
                    {!hideAddButton && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pl-1 mt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onAddCompany}
                                className="h-8 rounded hover:bg-muted text-muted-foreground font-normal px-2"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                New
                            </Button>
                            <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
                                <input
                                    type="number"
                                    className="w-12 h-7 border border-border rounded px-1.5 text-xs bg-background focus:outline-none focus:border-primary text-center"
                                    placeholder="10"
                                    defaultValue={10}
                                />
                                <span className="text-muted-foreground/60 text-xs text-nowrap">more rows at the bottom</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <BulkActionBar
                selectedCount={selectedCount}
                onClearSelection={() => setRowSelection({})}
                onAssign={() => setAssignDialogOpen(true)}
                onDelete={() => setDeleteDialogOpen(true)}
            />

            <BulkAssignDialog
                open={assignDialogOpen}
                onOpenChange={setAssignDialogOpen}
                selectedIds={table.getFilteredSelectedRowModel().rows.map(row => row.original.id)}
                onSuccess={() => {
                    setRowSelection({})
                    setInternalRefreshKey(k => k + 1)
                }}
            />

            <BulkDeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                selectedIds={table.getFilteredSelectedRowModel().rows.map(row => row.original.id)}
                onSuccess={() => {
                    setRowSelection({})
                    setInternalRefreshKey(k => k + 1)
                }}
            />
        </div>
    )
}
