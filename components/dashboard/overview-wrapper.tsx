import { getDashboardStats } from "@/lib/data"
import { Overview } from "@/components/overview"

export async function OverviewWrapper({ className }: { className?: string }) {
    const stats = await getDashboardStats()

    // @ts-ignore
    return <Overview className={className} data={stats.attendanceData} />
}
