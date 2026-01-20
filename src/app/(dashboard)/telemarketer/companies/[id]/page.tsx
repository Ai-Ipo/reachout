import { createClient } from "@/lib/supabase/server";
import { CompanyDetailView } from "@/features/companies/company-detail-view";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CompanyPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: company } = await supabase
        .from("companies")
        .select(`
            *,
            city:cities(name)
        `)
        .eq("id", id)
        .single();

    if (!company) {
        notFound();
    }

    return (
        <div className="p-4 h-[calc(100vh-2rem)]">
            <CompanyDetailView company={company} />
        </div>
    );
}
