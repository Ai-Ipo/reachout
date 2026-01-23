"use client"

import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CompanyDataTable } from "@/features/companies/company-data-table"
import { EditCompanyPanel } from "@/features/companies/edit-company-panel"
import type { TelemarketerStats } from "@/app/actions/get-team-stats"
import type { Company } from "@/features/companies/company-data-table"
import { cn } from "@/lib/utils"

interface TelemarketerDetailSheetProps {
    telemarketer: TelemarketerStats | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TelemarketerDetailSheet({ telemarketer, open, onOpenChange }: TelemarketerDetailSheetProps) {
    const [editingCompany, setEditingCompany] = useState<Company | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    if (!telemarketer) return null

    const { full_name, email, image_url, stats } = telemarketer

    const initials = full_name
        ? full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : email?.[0]?.toUpperCase() || "?"

    const displayName = full_name || email?.split("@")[0] || "Unknown"

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[90vw] lg:max-w-[80vw] p-0 flex flex-col"
            >
                <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border/50">
                            <AvatarImage src={image_url || undefined} />
                            <AvatarFallback className="text-sm bg-muted text-foreground/70">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle className="text-left">{displayName}</SheetTitle>
                            <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                        <div className="ml-auto flex items-center gap-4 text-xs">
                            <div className="text-center">
                                <p className="text-muted-foreground">Assigned</p>
                                <p className="font-semibold">{stats.total}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Interested</p>
                                <p className="font-semibold text-green-600">{stats.interested}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Pending</p>
                                <p className="font-semibold text-amber-600">{stats.queued}</p>
                            </div>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-row overflow-hidden">
                    <div className={cn("flex-1 overflow-auto p-4 min-w-0", {
                        "max-w-[calc(100%-400px)]": editingCompany
                    })}>
                        <CompanyDataTable
                            assignedTo={telemarketer.id}
                            refreshKey={refreshKey}
                            onEditCompany={setEditingCompany}
                            hideAssignColumn
                        />
                    </div>

                    {/* Edit Company Panel */}
                    {editingCompany && (
                        <div className="w-[400px] border-l border-border bg-background shrink-0 overflow-auto animate-in slide-in-from-right duration-300">
                            <EditCompanyPanel
                                company={editingCompany}
                                onClose={() => setEditingCompany(null)}
                                onSuccess={() => {
                                    setEditingCompany(null)
                                    setRefreshKey(prev => prev + 1)
                                }}
                            />
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
