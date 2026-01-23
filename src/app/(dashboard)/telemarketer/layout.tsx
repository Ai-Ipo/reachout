"use client"

import { RequireTelemarketer } from "@/components/require-role"

export default function TelemarketerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <RequireTelemarketer>{children}</RequireTelemarketer>
}
