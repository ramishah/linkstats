import { getFriends } from "@/lib/data"
import { LinkForm } from "@/components/link-form"

export default async function AddLinkPage() {
    const friends = await getFriends()

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold tracking-tight">Add New Link</h2>
            <LinkForm friends={friends} />
        </div>
    )
}
