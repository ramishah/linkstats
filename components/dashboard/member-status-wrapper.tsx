import { getFriends } from "@/lib/data"
import { MemberStatus } from "@/components/member-status"

export async function MemberStatusWrapper() {
    const friends = await getFriends()
    return (
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-full w-full">
            <MemberStatus friends={friends} />
        </div>
    )
}
