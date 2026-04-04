"use client"

import React, { useState, useMemo } from "react"
import Papa from "papaparse"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, FileUp, AlertCircle, CheckCircle, Loader2, Trash2, ExternalLink, ChevronRight, ArrowRight } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    detectColumnMapping,
    validateMapping,
    mapRowToCompany,
    DB_FIELDS,
    DIRECTOR_FIELDS,
    type DBField,
    type MappedCompanyData,
} from "@/lib/csv-column-map"

interface CityCSVUploadProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cityId: string
    cityName: string
    onSuccess: () => void
}

interface ParsedRow {
    original: Record<string, string>
    mapped: MappedCompanyData | null
    isDuplicate?: boolean
    duplicateId?: string // ID of existing company if duplicate
    isRemoved?: boolean // User removed this row from import
}

interface UploadResult {
    added: number
    duplicates: number
    errors: number
}

// Display labels for our database fields
const FIELD_LABELS: Record<DBField, string> = {
    name: "Company Name",
    internal_id: "Referral Code",
    financial_year: "FY",
    eligibility_status: "Eligibility",
    board_type: "Board",
    turnover: "Turnover",
    profit: "Profit",
    borrowed_funds: "Borrowed Funds",
    loan_interest: "Interest",
    eligible_amount: "Eligible Amt",
    official_mail: "Email",
    calling_status: "Status",
    whatsapp_status: "WhatsApp",
    response: "Response",
    assigned_to: "Assigned",
}

// Labels for all possible target fields (DB + director) used in the mapping dropdown
const ALL_FIELD_LABELS: Record<string, string> = {
    ...FIELD_LABELS,
    director_1_din: "Director 1 DIN",
    director_1_name: "Director 1 Name",
    director_1_contact: "Director 1 Contact",
    director_1_email: "Director 1 Email",
    director_2_din: "Director 2 DIN",
    director_2_name: "Director 2 Name",
    director_2_contact: "Director 2 Contact",
    director_2_email: "Director 2 Email",
    director_3_din: "Director 3 DIN",
    director_3_name: "Director 3 Name",
    director_3_contact: "Director 3 Contact",
    director_3_email: "Director 3 Email",
}

// All assignable fields for the mapping dropdown
const ALL_FIELDS = [...DB_FIELDS, ...DIRECTOR_FIELDS] as const

// Numeric fields for display formatting
const NUMERIC_DISPLAY_FIELDS = ["turnover", "profit", "borrowed_funds", "loan_interest", "eligible_amount"]

// Format value for display in preview table
function formatDisplayValue(value: string | number | null | undefined, field: string): string {
    if (value === null || value === undefined) return "-"
    if (typeof value === "number") {
        // Format large numbers in Indian style (lakhs/crores) for readability
        if (NUMERIC_DISPLAY_FIELDS.includes(field)) {
            const absValue = Math.abs(value)
            const sign = value < 0 ? "-" : ""
            if (absValue >= 10000000) {
                return `${sign}${(absValue / 10000000).toFixed(2)} Cr`
            } else if (absValue >= 100000) {
                return `${sign}${(absValue / 100000).toFixed(2)} L`
            } else if (absValue >= 1000) {
                return `${sign}${(absValue / 1000).toFixed(2)} K`
            }
            return value.toLocaleString("en-IN")
        }
        return value.toString()
    }
    return String(value)
}

// Get display value from mapped data
function getMappedValue(mapped: MappedCompanyData | null, field: DBField): string | number | null {
    if (!mapped) return null

    switch (field) {
        case "name":
            return mapped.name
        case "internal_id":
            return mapped.internal_id
        case "financial_year":
            return mapped.financial_year
        case "eligibility_status":
            return mapped.eligibility_status
        case "board_type":
            return mapped.board_type
        case "turnover":
            return mapped.turnover
        case "profit":
            return mapped.profit
        case "borrowed_funds":
            return mapped.borrowed_funds
        case "loan_interest":
            return mapped.loan_interest
        case "eligible_amount":
            return mapped.eligible_amount
        case "official_mail":
            return mapped.official_mail
        case "calling_status":
            return mapped.calling_status
        case "whatsapp_status":
            return mapped.whatsapp_status
        case "response":
            return mapped.response
        case "assigned_to":
            return mapped.assigned_to_name
        default:
            return null
    }
}

export function CityCSVUpload({ open, onOpenChange, cityId, cityName, onSuccess }: CityCSVUploadProps) {
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload")
    const [uploading, setUploading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedRow[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
    const [validationError, setValidationError] = useState<string | null>(null)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map()) // name -> id
    const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
    const [allHeaders, setAllHeaders] = useState<string[]>([])
    const [mappingExpanded, setMappingExpanded] = useState(false)
    const [showAllMappings, setShowAllMappings] = useState(false)
    const { getToken } = useAuth()

    // Get mapped fields that are present in the CSV
    const mappedFields = useMemo(() => {
        const fields = new Set(Object.values(columnMapping).filter(f => !f.startsWith("director_")))
        return DB_FIELDS.filter(f => fields.has(f))
    }, [columnMapping])

    // Check if we have director fields
    const hasDirectorFields = useMemo(() => {
        return Object.values(columnMapping).some(f => f.startsWith("director_"))
    }, [columnMapping])

    // Stats for preview
    const stats = useMemo(() => {
        const total = parsedData.length
        const removed = parsedData.filter(r => r.isRemoved).length
        const valid = parsedData.filter(r => r.mapped !== null && !r.isRemoved).length
        const duplicates = parsedData.filter(r => r.isDuplicate && !r.isRemoved).length
        const invalid = parsedData.filter(r => r.mapped === null && !r.isRemoved).length
        const toImport = parsedData.filter(r => r.mapped !== null && !r.isDuplicate && !r.isRemoved).length
        const withDirectors = parsedData.filter(r => r.mapped !== null && !r.isRemoved && r.mapped.directors.length > 0).length
        return { total, valid, duplicates, invalid, removed, toImport, withDirectors }
    }, [parsedData])

    // Headers not mapped to any DB field
    const unmappedHeaders = useMemo(() => {
        return allHeaders.filter(h => !columnMapping[h])
    }, [allHeaders, columnMapping])

    const mappedCount = allHeaders.length - unmappedHeaders.length

    // Get available DB fields for a given header's dropdown (exclude fields taken by other headers)
    const getAvailableFields = (currentHeader: string) => {
        const takenByOthers = new Set(
            Object.entries(columnMapping)
                .filter(([h]) => h !== currentHeader)
                .map(([, f]) => f)
        )
        return ALL_FIELDS.filter(f => !takenByOthers.has(f))
    }

    // Handle user changing a column mapping
    const handleMappingChange = (csvHeader: string, newDbField: string) => {
        const nextMapping = { ...columnMapping }

        if (newDbField === "__skip__") {
            delete nextMapping[csvHeader]
        } else {
            // If another header already maps to this field, remove that mapping
            if (!newDbField.startsWith("director_")) {
                for (const [key, value] of Object.entries(nextMapping)) {
                    if (value === newDbField && key !== csvHeader) {
                        delete nextMapping[key]
                    }
                }
            }
            nextMapping[csvHeader] = newDbField
        }

        setColumnMapping(nextMapping)

        // Re-map all rows with updated mapping
        setParsedData(prev =>
            rawRows.map((row, i) => ({
                original: row,
                mapped: mapRowToCompany(row, nextMapping),
                isDuplicate: prev[i]?.isDuplicate,
                duplicateId: prev[i]?.duplicateId,
                isRemoved: prev[i]?.isRemoved,
            }))
        )
    }

    // Remove a row from import
    const handleRemoveRow = (index: number) => {
        setParsedData(prev => prev.map((row, i) =>
            i === index ? { ...row, isRemoved: true } : row
        ))
    }

    const resetState = () => {
        setStep("upload")
        setParsedData([])
        setColumnMapping({})
        setValidationError(null)
        setResult(null)
        setProfileMap(new Map())
        setRawRows([])
        setAllHeaders([])
        setMappingExpanded(false)
        setShowAllMappings(false)
    }

    const handleClose = () => {
        resetState()
        onOpenChange(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setValidationError(null)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as Record<string, string>[]

                if (rows.length === 0) {
                    setValidationError("CSV file is empty")
                    setUploading(false)
                    return
                }

                // Detect column mapping
                const headers = Object.keys(rows[0])
                const { mapping, unmappedColumns: skipped } = detectColumnMapping(headers)
                const validation = validateMapping(mapping)

                if (!validation.valid) {
                    setValidationError(`Missing required columns: ${validation.missing.join(", ")}`)
                    setUploading(false)
                    return
                }

                setColumnMapping(mapping)
                setRawRows(rows)
                setAllHeaders(headers)
                setMappingExpanded(skipped.length > 0)

                // Map rows
                const mapped: ParsedRow[] = rows.map(row => ({
                    original: row,
                    mapped: mapRowToCompany(row, mapping),
                }))

                // Check for duplicates and load profile map
                try {
                    const token = await getToken({ template: "supabase", skipCache: true })
                    const supabase = createClient(token)

                    // Check for duplicate companies in this city
                    const { data: existingCompanies } = await supabase
                        .from("companies")
                        .select("id, name")
                        .eq("city_id", cityId)

                    // Create a map of lowercase name -> company id
                    const existingNameMap = new Map(
                        existingCompanies?.map(c => [c.name?.toLowerCase().trim(), c.id]) || []
                    )

                    // Mark duplicates and store the existing company ID
                    for (const row of mapped) {
                        if (row.mapped?.name) {
                            const normalizedName = String(row.mapped.name).toLowerCase().trim()
                            const existingId = existingNameMap.get(normalizedName)
                            if (existingId) {
                                row.isDuplicate = true
                                row.duplicateId = existingId
                            }
                        }
                    }

                    // Load profiles for assigned_to lookup
                    const assignedNames = new Set(
                        mapped
                            .filter(r => r.mapped?.assigned_to_name)
                            .map(r => r.mapped!.assigned_to_name!.toLowerCase().trim())
                    )

                    if (assignedNames.size > 0) {
                        const { data: profiles } = await supabase
                            .from("profiles")
                            .select("id, full_name, email")

                        if (profiles) {
                            const pMap = new Map<string, string>()
                            for (const profile of profiles) {
                                // Map by full name and email
                                if (profile.full_name) {
                                    pMap.set(profile.full_name.toLowerCase().trim(), profile.id)
                                }
                                if (profile.email) {
                                    pMap.set(profile.email.toLowerCase().trim(), profile.id)
                                }
                            }
                            setProfileMap(pMap)
                        }
                    }
                } catch (err) {
                    console.error("Error checking duplicates:", err)
                }

                setParsedData(mapped)
                setStep("preview")
                setUploading(false)
            },
            error: (error) => {
                setValidationError(`Failed to parse CSV: ${error.message}`)
                setUploading(false)
            },
        })
    }

    const handleImport = async () => {
        setImporting(true)

        try {
            const token = await getToken({ template: "supabase", skipCache: true })
            const supabase = createClient(token)

            // Filter to valid, non-duplicate, non-removed rows
            const rowsToInsert = parsedData.filter(
                r => r.mapped !== null && !r.isDuplicate && !r.isRemoved
            )

            let addedCount = 0
            let errorCount = 0

            for (const row of rowsToInsert) {
                const mapped = row.mapped!

                // Resolve assigned_to name to profile ID
                let assignedToId: string | null = null
                if (mapped.assigned_to_name) {
                    const normalizedName = mapped.assigned_to_name.toLowerCase().trim()
                    assignedToId = profileMap.get(normalizedName) || null
                }

                // Prepare company data
                const companyData = {
                    city_id: cityId,
                    name: mapped.name,
                    // Only set internal_id if provided (otherwise let trigger generate it)
                    ...(mapped.internal_id && { internal_id: mapped.internal_id }),
                    financial_year: mapped.financial_year || null,
                    eligibility_status: mapped.eligibility_status || "pending",
                    board_type: mapped.board_type || null,
                    turnover: mapped.turnover || null,
                    profit: mapped.profit || null,
                    borrowed_funds: mapped.borrowed_funds || null,
                    loan_interest: mapped.loan_interest || null,
                    eligible_amount: mapped.eligible_amount || null,
                    official_mail: mapped.official_mail || null,
                    calling_status: mapped.calling_status || "queued",
                    whatsapp_status: mapped.whatsapp_status || null,
                    response: mapped.response || null,
                    assigned_to: assignedToId,
                }

                // Insert company
                const { data: insertedCompany, error: companyError } = await supabase
                    .from("companies")
                    .insert(companyData)
                    .select("id")
                    .single()

                if (companyError) {
                    console.error("Insert error:", companyError)
                    errorCount++
                    continue
                }

                addedCount++

                // Insert directors if any
                if (mapped.directors.length > 0 && insertedCompany) {
                    const directorsToInsert = mapped.directors.map(dir => ({
                        company_id: insertedCompany.id,
                        din_no: dir.din_no || null,
                        name: dir.name || null,
                        contact_no: dir.contact_no || null,
                        email: dir.email || null,
                    }))

                    const { error: directorError } = await supabase
                        .from("directors")
                        .insert(directorsToInsert)

                    if (directorError) {
                        console.error("Director insert error:", directorError)
                        // Don't count as error - company was still created
                    }
                }
            }

            setResult({
                added: addedCount,
                duplicates: stats.duplicates,
                errors: errorCount,
            })
            setStep("result")

            if (addedCount > 0) {
                toast.success(`Successfully imported ${addedCount} companies`)
                onSuccess()
            }

            if (errorCount > 0) {
                toast.error(`${errorCount} companies failed to import`)
            }
        } catch (err) {
            console.error("Import error:", err)
            const errorMessage = err instanceof Error ? err.message : String(err)
            toast.error(`Import failed: ${errorMessage}`)
            setResult({
                added: 0,
                duplicates: stats.duplicates,
                errors: stats.toImport,
            })
            setStep("result")
        } finally {
            setImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="min-w-[90vw] w-full max-h-[90vh] h-full flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Import Companies to {cityName}</DialogTitle>
                            <DialogDescription>
                                {step === "upload" && "Upload a CSV file with company data"}
                                {step === "preview" && `Preview ${stats.toImport} companies to import`}
                                {step === "result" && "Import complete"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {/* Upload Step */}
                    {step === "upload" && (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="w-full max-w-md">
                                {validationError && (
                                    <Alert variant="destructive" className="mb-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{validationError}</AlertDescription>
                                    </Alert>
                                )}

                                <label
                                    htmlFor="csv-upload"
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <FileUp className={`w-12 h-12 mb-4 text-muted-foreground ${uploading ? "animate-bounce" : ""}`} />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">
                                                {uploading ? "Processing..." : "Click to upload or drag and drop"}
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">CSV file with company data</p>
                                    </div>
                                    <Input
                                        id="csv-upload"
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>

                                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                                    <p className="font-medium">Supported columns:</p>
                                    <p>Name of the company (required), Referral Code, Financial Year, Turnover, Profit, Borrowed funds, Loan Interest, Eligibility, Board, DIN 1-3, Director Name 1-3, Contact No 1-3, Email ID 1-3, Assigned to, Calling status, Response</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Step */}
                    {step === "preview" && (
                        <>
                            {/* Stats bar */}
                            <div className="flex-shrink-0 flex items-center gap-4 p-4 bg-muted/30 rounded-lg mb-4 flex-wrap">
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Total rows:</span>{" "}
                                    <span className="font-medium">{stats.total}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Valid:</span>{" "}
                                    <span className="font-medium text-status-success">{stats.valid}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Duplicates (skipped):</span>{" "}
                                    <span className="font-medium text-status-warning">{stats.duplicates}</span>
                                </div>
                                {hasDirectorFields && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">With directors:</span>{" "}
                                        <span className="font-medium">{stats.withDirectors}</span>
                                    </div>
                                )}
                                <div className="text-sm">
                                    <span className="text-muted-foreground">To import:</span>{" "}
                                    <span className="font-medium text-primary">{stats.toImport}</span>
                                </div>

                                <div className="ml-auto flex items-center gap-2">
                                    <Button variant="outline" onClick={resetState}>
                                        Choose different file
                                    </Button>
                                    <Button onClick={handleImport} disabled={importing || stats.toImport === 0}>
                                        {importing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Import {stats.toImport} companies
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Column Mapping Editor */}
                            {allHeaders.length > 0 && (
                                <div className="flex-shrink-0 mb-4">
                                    <button
                                        onClick={() => setMappingExpanded(prev => !prev)}
                                        className="flex w-full items-center gap-2 rounded-lg bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                                    >
                                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", mappingExpanded && "rotate-90")} />
                                        <span className="font-medium">Column Mapping</span>
                                        <span className="text-muted-foreground">{mappedCount}/{allHeaders.length} matched</span>
                                        {unmappedHeaders.length > 0 && (
                                            <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 text-xs">
                                                {unmappedHeaders.length} skipped
                                            </Badge>
                                        )}
                                    </button>

                                    {mappingExpanded && (
                                        <div className="mt-2 rounded-lg border bg-background">
                                            <div className="max-h-[220px] overflow-y-auto p-3">
                                                <div className="grid grid-cols-[1fr,16px,180px] gap-x-3 gap-y-2 items-center">
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CSV Column</span>
                                                    <span />
                                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Maps To</span>

                                                    {/* Unmapped columns */}
                                                    {unmappedHeaders.map(header => (
                                                        <React.Fragment key={header}>
                                                            <span className="text-sm truncate text-yellow-700 dark:text-yellow-500" title={header.trim()}>{header.trim()}</span>
                                                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                            <Select value="__skip__" onValueChange={(v) => handleMappingChange(header, v)}>
                                                                <SelectTrigger size="sm" className="h-7 text-xs w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="__skip__">Skip this column</SelectItem>
                                                                    <SelectSeparator />
                                                                    {getAvailableFields(header).map(f => (
                                                                        <SelectItem key={f} value={f}>{ALL_FIELD_LABELS[f] || f}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </React.Fragment>
                                                    ))}

                                                    {/* Mapped columns (when "show all") */}
                                                    {showAllMappings && (
                                                        <>
                                                            {unmappedHeaders.length > 0 && (
                                                                <div className="col-span-3 border-t my-1" />
                                                            )}
                                                            {allHeaders.filter(h => columnMapping[h]).map(header => (
                                                                <React.Fragment key={header}>
                                                                    <span className="text-sm truncate" title={header.trim()}>{header.trim()}</span>
                                                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                                                    <Select value={columnMapping[header]} onValueChange={(v) => handleMappingChange(header, v)}>
                                                                        <SelectTrigger size="sm" className="h-7 text-xs w-full">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="__skip__">Skip this column</SelectItem>
                                                                            <SelectSeparator />
                                                                            {getAvailableFields(header).map(f => (
                                                                                <SelectItem key={f} value={f}>{ALL_FIELD_LABELS[f] || f}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </React.Fragment>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-t px-3 py-1.5">
                                                <button
                                                    onClick={() => setShowAllMappings(prev => !prev)}
                                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showAllMappings ? "Show only unmapped" : `Show all ${allHeaders.length} columns`}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Preview table */}
                            <div className="flex-1 overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead className="w-[100px]">Status</TableHead>
                                            {mappedFields.map(field => (
                                                <TableHead key={field} className="whitespace-nowrap">
                                                    {FIELD_LABELS[field]}
                                                </TableHead>
                                            ))}
                                            {hasDirectorFields && (
                                                <TableHead>Directors</TableHead>
                                            )}
                                            <TableHead className="w-[80px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((row, index) => {
                                            if (row.isRemoved) return null

                                            return (
                                                <TableRow
                                                    key={index}
                                                    className={
                                                        row.mapped === null
                                                            ? "bg-destructive/10"
                                                            : row.isDuplicate
                                                                ? "bg-status-warning-muted"
                                                                : ""
                                                    }
                                                >
                                                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                    <TableCell>
                                                        {row.mapped === null ? (
                                                            <Badge variant="destructive" className="text-xs">Invalid</Badge>
                                                        ) : row.isDuplicate ? (
                                                            <Badge variant="secondary" className="text-xs bg-status-warning-muted text-status-warning-foreground">Duplicate</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-xs bg-status-success-muted text-status-success">Ready</Badge>
                                                        )}
                                                    </TableCell>
                                                    {mappedFields.map(field => (
                                                        <TableCell key={field} className="max-w-[200px] truncate">
                                                            {formatDisplayValue(getMappedValue(row.mapped, field), field)}
                                                        </TableCell>
                                                    ))}
                                                    {hasDirectorFields && (
                                                        <TableCell>
                                                            {row.mapped?.directors.length ? (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {row.mapped.directors.length} director{row.mapped.directors.length > 1 ? "s" : ""}
                                                                </span>
                                                            ) : "-"}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {row.isDuplicate && row.duplicateId && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => window.open(`/admin/companies/${row.duplicateId}`, '_blank')}
                                                                    title="View existing company"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                                                </Button>
                                                            )}
                                                            {(row.isDuplicate || row.mapped === null) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                                    onClick={() => handleRemoveRow(index)}
                                                                    title="Remove from list"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Info messages */}
                            <div className="flex-shrink-0 mt-2 space-y-1">
                                {!mappedFields.includes("eligibility_status") && (
                                    <p className="text-xs text-muted-foreground">
                                        No eligibility column detected. All companies will be marked as "pending".
                                    </p>
                                )}
                                {mappedFields.includes("assigned_to") && (
                                    <p className="text-xs text-muted-foreground">
                                        Assigned to will be matched by name or email. Unmatched names will be skipped.
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Result Step */}
                    {step === "result" && result && (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="w-full max-w-md space-y-4">
                                <Alert variant={result.errors > 0 ? "destructive" : "default"}>
                                    {result.errors > 0 ? (
                                        <AlertCircle className="h-4 w-4" />
                                    ) : (
                                        <CheckCircle className="h-4 w-4" />
                                    )}
                                    <AlertTitle>Import Complete</AlertTitle>
                                    <AlertDescription>
                                        <ul className="mt-2 space-y-1">
                                            <li>
                                                <span className="font-medium text-status-success">{result.added}</span> companies added
                                            </li>
                                            {result.duplicates > 0 && (
                                                <li>
                                                    <span className="font-medium text-status-warning">{result.duplicates}</span> duplicates skipped
                                                </li>
                                            )}
                                            {result.errors > 0 && (
                                                <li>
                                                    <span className="font-medium text-destructive">{result.errors}</span> errors
                                                </li>
                                            )}
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <Button onClick={handleClose} className="w-full">
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
