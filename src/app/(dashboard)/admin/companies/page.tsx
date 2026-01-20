import { CompanyTable } from "@/features/companies/company-table";
import { CsvUpload } from "@/features/companies/upload-csv";

export default function CompaniesPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">All Companies</h1>
                    <p className="text-muted-foreground">Master database of all IPO outreach targets.</p>
                </div>
                <CsvUpload />
            </div>

            <CompanyTable />
        </div>
    )
}
