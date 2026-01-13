import { getFriends } from "@/lib/data"
import { AddLinkDialog } from "@/components/add-link-dialog"

export async function AddLinkDialogWrapper() {
    const friends = await getFriends()
    return <AddLinkDialog friends={friends} />
}
