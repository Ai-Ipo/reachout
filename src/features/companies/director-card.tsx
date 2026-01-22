import { Copy, Mail, Phone, User, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Director {
    id: string
    din_no?: string
    name?: string
    contact_no?: string
    email?: string
    email_status?: string
    remark?: string
}

interface DirectorCardProps {
    director: Director
    onCopy: (text: string, label: string) => void
    className?: string
}

export function DirectorCard({ director, onCopy, className }: DirectorCardProps) {
    return (
        <div className={cn("group flex flex-col gap-3 p-3 rounded-md border bg-card hover:border-primary/50 transition-colors shadow-sm", className)}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-foreground leading-tight tracking-tight">{director.name || "Unknown Name"}</div>
                        {director.din_no && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">DIN: {director.din_no}</div>}
                    </div>
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
                {director.contact_no ? (
                    <div className="flex items-center justify-between group/item h-7">
                        <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <a href={`tel:${director.contact_no}`} className="text-sm text-foreground hover:text-primary transition-colors font-medium">
                                {director.contact_no}
                            </a>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover/item:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            onClick={() => onCopy(director.contact_no!, "Phone")}
                            title="Copy Phone"
                        >
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70 italic h-7">
                        <Phone className="w-3.5 h-3.5" />
                        No contact number
                    </div>
                )}

                {director.email ? (
                    <div className="flex items-center justify-between group/item h-7">
                        <div className="flex items-center gap-2 overflow-hidden max-w-[200px]">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <a href={`mailto:${director.email}`} className="text-sm text-foreground truncate hover:text-primary transition-colors">
                                {director.email}
                            </a>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover/item:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                            onClick={() => onCopy(director.email!, "Email")}
                            title="Copy Email"
                        >
                            <Copy className="w-3 h-3" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70 italic h-7">
                        <Mail className="w-3.5 h-3.5" />
                        No email address
                    </div>
                )}

                {director.remark && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50 mt-1">
                        <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-70" />
                        <span className="leading-snug">{director.remark}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
