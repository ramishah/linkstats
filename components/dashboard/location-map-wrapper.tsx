import { getLinksWithLocations, getSignificantLocations } from "@/lib/data"
import { LocationMap } from "@/components/dashboard/location-map"

export async function LocationMapWrapper() {
    const links = await getLinksWithLocations()
    // @ts-ignore
    const significantLocations = await getSignificantLocations()
    return <LocationMap links={links} significantLocations={significantLocations} />
}
