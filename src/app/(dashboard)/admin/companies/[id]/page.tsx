import { createClient } from "@/lib/supabase/server"
import { CompanyPage } from "@/features/companies/company-page"
import { notFound } from "next/navigation"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function AdminCompanyPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: company, error } = await supabase
        .from("companies")
        .select(`
            *,
            city:cities(id, name, short_code),
            assigned_profile:profiles!assigned_to(id, full_name, email),
            directors(id, din_no, name, contact_no, email, email_status, remark)
        `)
        .eq("id", id)
        .single()

    if (error || !company) {
        notFound()
    }

    // Transform assigned_profile if it's an array
    const transformedCompany = {
        ...company,
        assigned_profile: Array.isArray(company.assigned_profile)
            ? company.assigned_profile[0] || null
            : company.assigned_profile || null
    }

    return <CompanyPage company={transformedCompany} />
}
