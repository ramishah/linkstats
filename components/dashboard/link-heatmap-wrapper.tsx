import { getLinkDates } from "@/lib/data"
import { LinkHeatmap } from "./link-heatmap"

export async function LinkHeatmapWrapper() {
    const linkDates = await getLinkDates()
    return <LinkHeatmap linkDates={linkDates} />
}
