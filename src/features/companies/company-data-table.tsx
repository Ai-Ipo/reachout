"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@clerk/nextjs"
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type RowSelectionState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { DirectorCell } from "./director-cell"
import { formatCurrency, formatPercent, formatFinancialYear } from "@/lib/format"
import { callingStatusLabels, eligibilityStatusLabels } from "@/lib/schemas/company-schema"
import { ArrowUpDown, ChevronLeft, ChevronRight, Plus } from "lucide-react"

interface Director {
    id: string
    din_no?: string
    name?: string
    contact_no?: string
    email?: string
    email_status?: string
    remark?: string
}

interface Company {
    id: string
    internal_id: string
    name: string
    financial_year?: string
    turnover?: number
    profit?: number
    borrowed_funds?: number
    loan_interest?: number
    eligibility_status: string
    board_type?: string
    official_mail?: string
    representative_name?: string
    calling_status: string
    response?: string
    whatsapp_status?: string
    remarks?: string
    directors: Director[]
}

interface CompanyDataTableProps {
    cityId: string
    onAddCompany?: () => void
}

export function CompanyDataTable({ cityId, onAddCompany }: CompanyDataTableProps) {
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)
    const [sorting, setSorting] = useState<SortingState>([])
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [totalCount, setTotalCount] = useState(0)
    const { getToken } = useAuth()

    const pageSize = 100

    // Column definitions - Notion-style
    const columns = useMemo<ColumnDef<Company>[]>(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="border-gray-300"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="border-gray-300"
                />
            ),
            enableSorting: false,
            size: 32,
        },
        {
            id: "rowNumber",
            header: "",
            cell: ({ row }) => (
                <span className="text-xs text-gray-400 tabular-nums">{row.index + 1}</span>
            ),
            size: 32,
        },
        {
            accessorKey: "internal_id",
            header: "ID",
            cell: ({ row }) => (
                <span className="font-mono text-xs text-gray-500">
                    {row.getValue("internal_id") || "-"}
                </span>
            ),
            size: 80,
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Company Name
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="font-medium text-gray-900">{row.getValue("name")}</span>
            ),
            size: 180,
        },
        {
            accessorKey: "financial_year",
            header: "FY",
            cell: ({ row }) => (
                <span className="text-gray-600">{formatFinancialYear(row.getValue("financial_year"))}</span>
            ),
            size: 70,
        },
        {
            accessorKey: "turnover",
            header: ({ column }) => (
                <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Turnover
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
            ),
            cell: ({ row }) => (
                <span className="text-gray-600 tabular-nums">{formatCurrency(row.getValue("turnover"))}</span>
            ),
            size: 90,
        },
        {
            accessorKey: "profit",
            header: "Profit",
            cell: ({ row }) => (
                <span className="text-gray-600 tabular-nums">{formatCurrency(row.getValue("profit"))}</span>
            ),
            size: 90,
        },
        {
            accessorKey: "borrowed_funds",
            header: "Funds",
            cell: ({ row }) => (
                <span className="text-gray-600 tabular-nums">{formatCurrency(row.getValue("borrowed_funds"))}</span>
            ),
            size: 90,
        },
        {
            accessorKey: "loan_interest",
            header: "Interest",
            cell: ({ row }) => (
                <span className="text-gray-600 tabular-nums">{formatPercent(row.getValue("loan_interest"))}</span>
            ),
            size: 70,
        },
        {
            accessorKey: "eligibility_status",
            header: "Eligibility",
            cell: ({ row }) => {
                const status = row.getValue("eligibility_status") as string
                return (
                    <span className="text-gray-600">
                        {eligibilityStatusLabels[status as keyof typeof eligibilityStatusLabels] || status}
                    </span>
                )
            },
            size: 80,
        },
        {
            accessorKey: "board_type",
            header: "Board",
            cell: ({ row }) => (
                <span className="text-gray-600">{row.getValue("board_type") || "-"}</span>
            ),
            size: 60,
        },
        {
            id: "directors",
            header: "Directors",
            cell: ({ row }) => <DirectorCell directors={row.original.directors} />,
            size: 90,
        },
        {
            accessorKey: "official_mail",
            header: "Official Email",
            cell: ({ row }) => (
                <span className="text-xs text-gray-500 truncate max-w-[140px] block">
                    {row.getValue("official_mail") || "-"}
                </span>
            ),
            size: 140,
        },
        {
            accessorKey: "representative_name",
            header: "Rep",
            cell: ({ row }) => (
                <span className="text-gray-600">{row.getValue("representative_name") || "-"}</span>
            ),
            size: 90,
        },
        {
            accessorKey: "calling_status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("calling_status") as string
                return (
                    <span className="text-gray-600">
                        {callingStatusLabels[status as keyof typeof callingStatusLabels] || status}
                    </span>
                )
            },
            size: 90,
        },
        {
            accessorKey: "response",
            header: "Response",
            cell: ({ row }) => (
                <span className="text-xs text-gray-500 truncate max-w-[100px] block">
                    {row.getValue("response") || "-"}
                </span>
            ),
            size: 100,
        },
        {
            accessorKey: "whatsapp_status",
            header: "WhatsApp",
            cell: ({ row }) => (
                <span className="text-gray-600">{row.getValue("whatsapp_status") || "-"}</span>
            ),
            size: 80,
        },
    ], [])

    // Fetch companies
    useEffect(() => {
        async function fetchCompanies() {
            setLoading(true)
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // Fetch companies with directors
            const { data, error, count } = await supabase
                .from("companies")
                .select(`
                    id,
                    internal_id,
                    name,
                    financial_year,
                    turnover,
                    profit,
                    borrowed_funds,
                    loan_interest,
                    eligibility_status,
                    board_type,
                    official_mail,
                    representative_name,
                    calling_status,
                    response,
                    whatsapp_status,
                    remarks,
                    directors(id, din_no, name, contact_no, email, email_status, remark)
                `, { count: "exact" })
                .eq("city_id", cityId)
                .order("created_at", { ascending: false })

            if (error) {
                console.error("Error fetching companies:", error)
            } else {
                setCompanies(data || [])
                setTotalCount(count || 0)
            }
            setLoading(false)
        }

        if (cityId) fetchCompanies()
    }, [cityId, getToken])

    // Table instance
    const table = useReactTable({
        data: companies,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize,
            },
        },
    })

    const selectedCount = Object.keys(rowSelection).length

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-700">Companies</h3>
                    <span className="text-xs text-gray-400">
                        ({totalCount} total{selectedCount > 0 && `, ${selectedCount} selected`})
                    </span>
                </div>
                <Button onClick={onAddCompany} size="sm" className="h-7 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Company
                </Button>
            </div>

            {/* Table - Notion style */}
            <div className="border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-gray-200 bg-gray-50/80">
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        style={{ width: header.getSize() }}
                                        className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 border-r border-gray-100 last:border-r-0"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
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
                                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors data-[state=selected]:bg-blue-50/50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-2 py-1.5 border-r border-gray-50 last:border-r-0"
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
                                    className="h-20 text-center text-gray-400 text-sm"
                                >
                                    No companies found. Click &quot;Add Company&quot; to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Minimal style */}
            <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        className="px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                        Previous
                    </button>
                    <button
                        className="px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
