"use client"

import { RequireAdmin } from "@/components/require-role"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <RequireAdmin>{children}</RequireAdmin>
}
