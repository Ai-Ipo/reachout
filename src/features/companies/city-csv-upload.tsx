"use client"

import { useState, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Upload, FileUp, AlertCircle, CheckCircle, Loader2, Trash2, ExternalLink } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import {
    detectColumnMapping,
    validateMapping,
    mapRowToCompany,
    DB_FIELDS,
    type DBField,
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
    mapped: Record<string, string | number | null> | null
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
    eligibility_status: "Eligibility",
    turnover: "Turnover",
    profit: "Profit",
    borrowed_funds: "Borrowed Funds",
    loan_interest: "Loan Interest",
}

// Numeric fields for display formatting
const NUMERIC_DISPLAY_FIELDS = ["turnover", "profit", "borrowed_funds", "loan_interest"]

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

export function CityCSVUpload({ open, onOpenChange, cityId, cityName, onSuccess }: CityCSVUploadProps) {
    const [step, setStep] = useState<"upload" | "preview" | "result">("upload")
    const [uploading, setUploading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedRow[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
    const [validationError, setValidationError] = useState<string | null>(null)
    const [result, setResult] = useState<UploadResult | null>(null)
    const { getToken } = useAuth()

    // Get mapped fields that are present in the CSV
    const mappedFields = useMemo(() => {
        const fields = new Set(Object.values(columnMapping))
        return DB_FIELDS.filter(f => fields.has(f))
    }, [columnMapping])

    // Stats for preview
    const stats = useMemo(() => {
        const total = parsedData.length
        const removed = parsedData.filter(r => r.isRemoved).length
        const valid = parsedData.filter(r => r.mapped !== null && !r.isRemoved).length
        const duplicates = parsedData.filter(r => r.isDuplicate && !r.isRemoved).length
        const invalid = parsedData.filter(r => r.mapped === null && !r.isRemoved).length
        const toImport = parsedData.filter(r => r.mapped !== null && !r.isDuplicate && !r.isRemoved).length
        return { total, valid, duplicates, invalid, removed, toImport }
    }, [parsedData])

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
                const mapping = detectColumnMapping(headers)
                const validation = validateMapping(mapping)

                if (!validation.valid) {
                    setValidationError(`Missing required columns: ${validation.missing.join(", ")}`)
                    setUploading(false)
                    return
                }

                setColumnMapping(mapping)

                // Map rows
                const mapped: ParsedRow[] = rows.map(row => ({
                    original: row,
                    mapped: mapRowToCompany(row, mapping),
                }))

                // Check for duplicates against existing companies in this city
                try {
                    const token = await getToken({ template: "supabase", skipCache: true })
                    const supabase = createClient(token)

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
                            const normalizedName = row.mapped.name.toLowerCase().trim()
                            const existingId = existingNameMap.get(normalizedName)
                            if (existingId) {
                                row.isDuplicate = true
                                row.duplicateId = existingId
                            }
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
            const toInsert = parsedData
                .filter(r => r.mapped !== null && !r.isDuplicate && !r.isRemoved)
                .map(r => ({
                    city_id: cityId,
                    name: r.mapped!.name,
                    eligibility_status: r.mapped!.eligibility_status || "pending",
                    turnover: r.mapped!.turnover || null,
                    profit: r.mapped!.profit || null,
                    borrowed_funds: r.mapped!.borrowed_funds || null,
                    loan_interest: r.mapped!.loan_interest || null,
                }))

            let addedCount = 0
            let errorCount = 0

            if (toInsert.length > 0) {
                // Batch insert in chunks of 100
                const chunkSize = 100
                for (let i = 0; i < toInsert.length; i += chunkSize) {
                    const chunk = toInsert.slice(i, i + chunkSize)
                    const { error } = await supabase.from("companies").insert(chunk)
                    if (error) {
                        console.error("Insert error:", error)
                        toast.error(`Failed to insert batch: ${error.message}`)
                        errorCount += chunk.length
                    } else {
                        addedCount += chunk.length
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
            <DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-full flex flex-col">
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
                                        <p className="text-xs text-muted-foreground">CSV file with "Company Name" column (required)</p>
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
                            </div>
                        </div>
                    )}

                    {/* Preview Step */}
                    {step === "preview" && (
                        <>
                            {/* Stats bar */}
                            <div className="flex-shrink-0 flex items-center gap-4 p-4 bg-muted/30 rounded-lg mb-4">
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

                            {/* Preview table */}
                            <div className="flex-1 overflow-auto border rounded-lg">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            {mappedFields.map(field => (
                                                <TableHead key={field}>{FIELD_LABELS[field]}</TableHead>
                                            ))}
                                            <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                                                            {formatDisplayValue(row.mapped?.[field], field)}
                                                        </TableCell>
                                                    ))}
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

                            {/* Info message when no eligibility column detected */}
                            {!mappedFields.includes("eligibility_status") && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    No eligibility column detected. All companies will be marked as "pending".
                                </p>
                            )}
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
