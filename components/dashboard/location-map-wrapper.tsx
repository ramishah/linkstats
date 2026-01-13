import { getLinksWithLocations } from "@/lib/data"
import { LocationMap } from "@/components/dashboard/location-map"

export async function LocationMapWrapper() {
    const links = await getLinksWithLocations()
    return <LocationMap links={links} />
}
