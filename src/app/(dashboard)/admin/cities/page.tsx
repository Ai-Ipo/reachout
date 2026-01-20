import { CityDialog } from "@/features/cities/city-dialog";
import { CityList } from "@/features/cities/city-list";

export default function CitiesPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">City Management</h1>
                    <p className="text-muted-foreground">Manage operation locations and ID codes.</p>
                </div>
                <CityDialog />
            </div>

            <CityList />
        </div>
    )
}
