import { getAllLinksWithMedia } from "@/lib/data"
import { AllMedia } from "@/components/dashboard/recent-media"

export async function AllMediaWrapper() {
    const linksWithMedia = await getAllLinksWithMedia()

    return <AllMedia linksWithMedia={linksWithMedia as any} />
}
