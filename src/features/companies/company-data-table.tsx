"use client"

import { useEffect, useState, useMemo, useCallback, useRef, useLayoutEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
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
import { ArrowUpDown, Plus, Type, Hash, Building2, Users, Mail, Phone, Settings2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
}

export interface Company {
    id: string
    internal_id: string
    city_id: string
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
    cityId: string
    onAddCompany?: () => void
    refreshKey?: number
    onEditCompany?: (company: Company | null) => void
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

export function CompanyDataTable({ cityId, onAddCompany, refreshKey, onEditCompany }: CompanyDataTableProps) {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = useState("")
    const [totalCount, setTotalCount] = useState(0)
    const [pageSize, setPageSize] = useState(50)
    const [callingStatusFilter, setCallingStatusFilter] = useState<string[]>([])
    const [eligibilityFilter, setEligibilityFilter] = useState<string[]>([])
    const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all")
    const [internalRefreshKey, setInternalRefreshKey] = useState(0)
    const { getToken } = useAuth()

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
            id: "assigned",
            header: "Assigned",
            cell: ({ row }) => (
                <QuickAssignSelect
                    companyId={row.original.id}
                    currentAssignment={row.original.assigned_profile || null}
                    onOptimisticUpdate={(profile) => {
                        setCompanies(prev => prev.map(c =>
                            c.id === row.original.id
                                ? { ...c, assigned_to: profile?.id || null, assigned_profile: profile }
                                : c
                        ))
                    }}
                />
            ),
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
                        currentStatus={status as "queued" | "picked_up" | "not_answered" | "not_contactable" | "interested" | "not_interested"}
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
            size: 80,
        },
    ], [])

    // Sync filter state to column filters
    useEffect(() => {
        const filters: ColumnFiltersState = []
        if (callingStatusFilter.length > 0) {
            filters.push({ id: "calling_status", value: callingStatusFilter })
        }
        if (eligibilityFilter.length > 0) {
            filters.push({ id: "eligibility_status", value: eligibilityFilter })
        }
        setColumnFilters(filters)
    }, [callingStatusFilter, eligibilityFilter])

    // Fetch companies function (can be called silently)
    const fetchCompanies = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        const token = await getToken({ template: "supabase", skipCache: true })
        const supabase = createClient(token)

        const { data, error, count } = await supabase
            .from("companies")
            .select(`
                id,
                internal_id,
                city_id,
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
                assigned_profile:profiles!assigned_to(id, full_name, email),
                directors(id, din_no, name, contact_no, email, email_status, remark)
            `, { count: "exact" })
            .eq("city_id", cityId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching companies:", error)
        } else {
            // Transform data to handle Supabase returning profile as array
            const transformed = (data || []).map(company => ({
                ...company,
                assigned_profile: Array.isArray(company.assigned_profile)
                    ? company.assigned_profile[0] || null
                    : company.assigned_profile || null
            }))
            setCompanies(transformed)
            setTotalCount(count || 0)
        }
        if (!silent) setLoading(false)
    }, [cityId, getToken])

    // Initial fetch and refresh on key change
    useEffect(() => {
        if (cityId) fetchCompanies(false)
    }, [cityId, refreshKey])

    // Silent refresh when internalRefreshKey changes (after edits)
    useEffect(() => {
        if (internalRefreshKey > 0 && cityId) fetchCompanies(true)
    }, [internalRefreshKey])

    // Optimistic update helper - updates a single company field locally
    const updateCompanyField = useCallback((companyId: string, field: keyof Company, value: unknown) => {
        setCompanies(prev => prev.map(c =>
            c.id === companyId ? { ...c, [field]: value } : c
        ))
    }, [])

    // Filter by assignment status
    const filteredByAssignment = useMemo(() => {
        if (assignmentFilter === "all") return companies
        if (assignmentFilter === "assigned") return companies.filter((c) => c.assigned_to)
        return companies.filter((c) => !c.assigned_to)
    }, [companies, assignmentFilter])

    // Table instance
    const table = useReactTable({
        data: filteredByAssignment,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
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

    if (loading) {
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
                    {/* Toolbar */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-medium text-foreground">Companies</h3>
                            <span className="text-xs text-muted-foreground">
                                {filteredCount !== totalCount ? `${filteredCount} of ` : ""}
                                {totalCount} total
                                {selectedCount > 0 && (
                                    <span className="ml-1 text-primary">({selectedCount} selected)</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Search companies..."
                                value={globalFilter ?? ""}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="h-7 w-[180px] text-xs"
                            />
                            <button
                                onClick={onAddCompany}
                                className="inline-flex items-center gap-1.5 px-3 h-7 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Company
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-7 w-7 p-0">
                                        <Settings2 className="h-3.5 w-3.5" />
                                        <span className="sr-only">View</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[150px]">
                                    {table
                                        .getAllColumns()
                                        .filter(
                                            (column) =>
                                                typeof column.accessorFn !== "undefined" && column.getCanHide()
                                        )
                                        .map((column) => {
                                            return (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    className="capitalize text-xs"
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                >
                                                    {column.id.replace(/_/g, " ")}
                                                </DropdownMenuCheckboxItem>
                                            )
                                        })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Table - Notion style */}
                    <div className="border border-border overflow-x-auto rounded-sm bg-background max-w-[calc(100vw-16rem)]">
                        <table
                            className="text-sm border-collapse table-fixed"
                            style={{ width: table.getTotalSize() }}
                        >
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50/50">
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                style={{ width: header.getSize() }}
                                                className="h-9 px-2 text-left text-[13px] font-normal text-gray-500 border-r border-gray-200 last:border-r-0 select-none relative group"
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
                                                            header.column.getIsResizing() && "bg-blue-500 opacity-100 w-1.5"
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
                                                "group border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer",
                                                "data-[state=selected]:bg-blue-50/50"
                                            )}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <td
                                                    key={cell.id}
                                                    style={{ width: cell.column.getSize() }}
                                                    className="h-9 px-2 border-r border-gray-100 last:border-r-0 text-[13px] text-gray-700 data-[state=selected]:border-blue-100 overflow-hidden"
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
                                            className="h-24 text-center text-gray-400 text-sm"
                                        >
                                            No companies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Notion-like Footer */}
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
                </div>
            </div>
        </div>
    )
}
