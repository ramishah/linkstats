import { getFriends, getSignificantLocations } from "@/lib/data"
import { AddLinkDialog } from "@/components/add-link-dialog"

export async function AddLinkDialogWrapper() {
    const [friends, significantLocations] = await Promise.all([
        getFriends(),
        getSignificantLocations()
    ])
    return <AddLinkDialog friends={friends} significantLocations={significantLocations} />
}
