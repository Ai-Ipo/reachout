"use client"

import { useState } from "react"
import Papa from "papaparse"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileUp, AlertCircle, CheckCircle } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

export function CsvUpload() {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<{ success: number; errors: number } | null>(null)
    const { getToken } = useAuth()

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        setResult(null)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[]
                // Basic validation: Check if required columns exist?
                // For now, assume CSV matches schema roughly or map it.
                // Schema: name, city (we need city_id), financial_year, turnover, profit, borrowed_funds, board_type, website, directors_json?

                // To insert, we first need to resolve City Short Codes or Names to UUIDs.
                // This is complex. Better strategy: Input requires City Short Code column.
                // Fetch all cities map first.

                try {
                    const token = await getToken({ template: "supabase", skipCache: true })
                    const supabase = createClient(token)

                    const { data: cities } = await supabase.from('cities').select('id, short_code, name')
                    const cityMap = new Map(cities?.map(c => [c.short_code, c.id])) // Map Short Code -> ID
                    const nameMap = new Map(cities?.map(c => [c.name.toUpperCase(), c.id])) // Map Name -> ID

                    const toInsert = []
                    let errorCount = 0

                    for (const row of rows) {
                        // Attempt to find city ID
                        const cityKey = row['City Code'] || row['City'] || row['city_short_code']
                        let cityId = cityMap.get(cityKey) || nameMap.get(cityKey?.toUpperCase())

                        if (!cityId) {
                            console.warn(`Skipping row: City not found for ${cityKey}`, row)
                            errorCount++
                            continue
                        }

                        toInsert.push({
                            name: row['Company Name'] || row['name'],
                            city_id: cityId,
                            financial_year: row['Financial Year'] || row['financial_year'],
                            turnover: parseFloat(row['Turnover'] || row['turnover'] || 0),
                            profit: parseFloat(row['Profit'] || row['profit'] || 0),
                            borrowed_funds: parseFloat(row['Borrowed Funds'] || row['borrowed_funds'] || 0),
                            board_type: row['Board Type'] || row['board_type'],
                            website: row['Website'] || row['website'],
                            remarks: row['Remarks'] || row['remarks'],
                            // Directors? If complex, maybe skip for now or store in separate table later.
                        })
                    }

                    if (toInsert.length > 0) {
                        // Batch insert
                        const { error } = await supabase.from('companies').insert(toInsert)
                        if (error) throw error
                    }

                    setResult({ success: toInsert.length, errors: errorCount })
                } catch (err) {
                    console.error("Upload error:", err)
                    setResult({ success: 0, errors: rows.length }) // Treat all as failed if batch fails
                } finally {
                    setUploading(false)
                }
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Import Companies</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file. Required columns: "Company Name", "City Code" (or "City").
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!result && (
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileUp className={`w-8 h-8 mb-4 text-gray-500 ${uploading ? 'animate-bounce' : ''}`} />
                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">{uploading ? 'Processing...' : 'Click to upload'}</span></p>
                                </div>
                                <Input
                                    id="dropzone-file"
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    )}

                    {result && (
                        <div className="space-y-4">
                            <Alert variant={result.errors > 0 ? "destructive" : "default"}>
                                {result.errors > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                <AlertTitle>Import Complete</AlertTitle>
                                <AlertDescription>
                                    Successfully imported {result.success} companies.
                                    {result.errors > 0 && ` Failed to import ${result.errors} rows (check console for details).`}
                                </AlertDescription>
                            </Alert>
                            <Button onClick={() => { setOpen(false); setResult(null); }} className="w-full">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
