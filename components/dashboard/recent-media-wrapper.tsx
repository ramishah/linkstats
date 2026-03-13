import { getRecentMedia, getRecentPlinkLinks } from "@/lib/data"
import { RecentMedia } from "@/components/dashboard/recent-media"

export async function RecentMediaWrapper() {
    const [media, plinkLinks] = await Promise.all([
        getRecentMedia(),
        getRecentPlinkLinks(),
    ])

    return <RecentMedia media={media as any} plinkLinks={plinkLinks} />
}
