"use client"

import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Users, Phone, Mail, MessageSquare } from "lucide-react"

interface Director {
    id?: string
    din_no?: string
    name?: string
    contact_no?: string
    email?: string
    email_status?: string
    remark?: string
}

interface DirectorCellProps {
    directors: Director[]
}

export function DirectorCell({ directors }: DirectorCellProps) {
    if (!directors || directors.length === 0) {
        return <span className="text-muted-foreground">-</span>
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors"
                >
                    <Users className="w-3 h-3 mr-1" />
                    {directors.length} Director{directors.length > 1 ? "s" : ""}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                    <h4 className="font-medium text-sm">Directors ({directors.length})</h4>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {directors.map((director, idx) => (
                        <div
                            key={director.id || idx}
                            className="p-3 border-b last:border-b-0 hover:bg-muted/50"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">
                                    {director.name || "Unknown"}
                                </span>
                                {director.din_no && (
                                    <span className="text-xs font-mono text-muted-foreground">
                                        DIN: {director.din_no}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 text-xs text-muted-foreground">
                                {director.contact_no && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-3 h-3" />
                                        <span>{director.contact_no}</span>
                                    </div>
                                )}
                                {director.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        <span className="flex-1 truncate">{director.email}</span>
                                        {director.email_status && (
                                            <Badge
                                                variant={director.email_status === "valid" ? "default" : "secondary"}
                                                className="text-[10px] px-1 py-0"
                                            >
                                                {director.email_status}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                                {director.remark && (
                                    <div className="flex items-start gap-2 mt-2">
                                        <MessageSquare className="w-3 h-3 mt-0.5" />
                                        <span className="italic">{director.remark}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
