"use client"

import { CityGrid } from "@/features/cities/city-grid";
import { RequireAdmin } from "@/components/require-role";

export default function DashboardPage() {
  return (
    <RequireAdmin>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <CityGrid />
      </div>
    </RequireAdmin>
  )
}
