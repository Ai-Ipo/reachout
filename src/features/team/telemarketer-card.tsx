"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TelemarketerStats } from "@/app/actions/get-team-stats"
import { cn } from "@/lib/utils"

interface TelemarketerCardProps {
    telemarketer: TelemarketerStats
    onViewAssignments: (telemarketer: TelemarketerStats) => void
}

export function TelemarketerCard({ telemarketer, onViewAssignments }: TelemarketerCardProps) {
    const { full_name, email, image_url, stats } = telemarketer

    const initials = full_name
        ? full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
        : email?.[0]?.toUpperCase() || "?"

    const displayName = full_name || email?.split("@")[0] || "Unknown"

    // Calculate completion rate
    // Completed = terminal states (interested, not_interested, not_contactable)
    const completed = stats.interested + stats.not_interested + stats.not_contactable
    // In Progress = callback, not_answered (needs follow-up)
    const inProgress = stats.callback + stats.not_answered
    // Pending = not started
    const pending = stats.queued

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <Avatar className="w-10 h-10 border border-border/50">
                        <AvatarImage src={image_url || undefined} />
                        <AvatarFallback className="text-sm bg-muted text-foreground/70">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{displayName}</h3>
                        <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Total Assigned</span>
                        <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Pending</span>
                        <span className={cn("font-medium", pending > 0 && "text-amber-600")}>{pending}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">In Progress</span>
                        <span className={cn("font-medium", inProgress > 0 && "text-blue-600")}>{inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Interested</span>
                        <span className={cn("font-medium", stats.interested > 0 && "text-green-600")}>{stats.interested}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Not Interested</span>
                        <span className="font-medium text-muted-foreground">{stats.not_interested}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Not Contactable</span>
                        <span className="font-medium text-muted-foreground">{stats.not_contactable}</span>
                    </div>
                </div>

                {/* Progress bar */}
                {stats.total > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Completion</span>
                            <span>{Math.round((completed / stats.total) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
                            {stats.interested > 0 && (
                                <div
                                    className="bg-green-500 h-full"
                                    style={{ width: `${(stats.interested / stats.total) * 100}%` }}
                                />
                            )}
                            {stats.not_interested > 0 && (
                                <div
                                    className="bg-gray-400 h-full"
                                    style={{ width: `${(stats.not_interested / stats.total) * 100}%` }}
                                />
                            )}
                            {stats.not_contactable > 0 && (
                                <div
                                    className="bg-red-400 h-full"
                                    style={{ width: `${(stats.not_contactable / stats.total) * 100}%` }}
                                />
                            )}
                            {inProgress > 0 && (
                                <div
                                    className="bg-blue-500 h-full"
                                    style={{ width: `${(inProgress / stats.total) * 100}%` }}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Action */}
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => onViewAssignments(telemarketer)}
                >
                    View Assignments
                </Button>
            </CardContent>
        </Card>
    )
}
