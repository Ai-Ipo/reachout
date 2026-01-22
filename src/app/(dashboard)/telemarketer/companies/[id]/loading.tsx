import { Skeleton } from "@/components/ui/skeleton"

export default function CompanyLoading() {
    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-background h-14 shrink-0">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" /> {/* Back button */}
                    <div className="space-y-1.5">
                        <Skeleton className="h-5 w-48" /> {/* Company Name */}
                        <div className="flex gap-2">
                            <Skeleton className="h-4 w-20 rounded-full" />
                            <Skeleton className="h-4 w-24 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" /> {/* Action buttons */}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Split Layout Skeleton */}
                <div className="w-[450px] border-r flex flex-col bg-background h-full shrink-0">

                    {/* Zone A: Context Deck (Top, Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {/* Directors Section */}
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-32" />
                            <div className="space-y-3">
                                <Skeleton className="h-32 w-full rounded-xl" />
                                <Skeleton className="h-32 w-full rounded-xl" />
                            </div>
                        </div>

                        {/* Snapshot Section */}
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-32" />
                            <div className="grid grid-cols-2 gap-3">
                                <Skeleton className="h-20 w-full rounded-lg" />
                                <Skeleton className="h-20 w-full rounded-lg" />
                                <Skeleton className="h-20 w-full rounded-lg" />
                                <Skeleton className="h-20 w-full rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Zone B: Action Deck (Fixed Bottom) */}
                    <div className="border-t bg-blue-50/50 p-0 h-[60px] border-l-4 border-l-primary/20 shrink-0">
                        <div className="px-5 py-3 h-full flex items-center">
                            <Skeleton className="h-5 w-32 bg-blue-200/50" />
                        </div>
                    </div>
                </div>

                {/* Right Panel - Website Skeleton */}
                <div className="flex-1 flex flex-col relative p-4 bg-muted/20">
                    <div className="flex-1 rounded-xl bg-background border border-muted shadow-sm overflow-hidden flex flex-col">
                        {/* Fake Browser Toolbar */}
                        <div className="h-8 bg-muted/30 border-b flex items-center px-3 gap-2">
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="ml-4 h-4 w-64 rounded-sm bg-muted/50" />
                        </div>
                        <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4">
                            <Skeleton className="h-12 w-12 rounded-full opacity-20" />
                            <Skeleton className="h-4 w-48 opacity-20" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
