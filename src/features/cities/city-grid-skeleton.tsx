import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function CityGridSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" /> {/* Title */}
                    <Skeleton className="h-5 w-96" /> {/* Subtitle */}
                </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => (
                    <Card key={i} className="h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-6 w-32" /> {/* City Name */}
                            <Skeleton className="h-5 w-12 rounded-full" /> {/* Badge */}
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 flex items-center space-x-4">
                                <Skeleton className="h-4 w-24" /> {/* Stats */}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Add New Card Skeleton */}
                <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed p-6">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-24" />
                </div>
            </div>
        </div>
    )
}
