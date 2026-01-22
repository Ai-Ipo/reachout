import { CityGridSkeleton } from "@/features/cities/city-grid-skeleton"

export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <CityGridSkeleton />
        </div>
    )
}
