import { getFriends, getSignificantLocations } from "@/lib/data"
import { LinkForm } from "@/components/link-form"

export default async function AddLinkPage() {
    const [friends, significantLocations] = await Promise.all([
        getFriends(),
        getSignificantLocations()
    ])

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold tracking-tight">Add New Link</h2>
            <LinkForm friends={friends} significantLocations={significantLocations} />
        </div>
    )
}
