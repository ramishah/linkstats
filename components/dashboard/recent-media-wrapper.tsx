import { getRecentMedia } from "@/lib/data"
import { RecentMedia } from "@/components/dashboard/recent-media"

export async function RecentMediaWrapper() {
    const media = await getRecentMedia()

    return <RecentMedia media={media as any} />
}
