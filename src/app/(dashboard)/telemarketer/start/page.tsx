import { AssignmentList } from "@/features/telemarketer/assignment-list";

export default function TelemarketerStartPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pending Calls</h1>
                    <p className="text-muted-foreground">Companies assigned to you for outreach.</p>
                </div>
            </div>

            <AssignmentList />
        </div>
    )
}
