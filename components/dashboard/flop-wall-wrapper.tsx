import { getFriends, getFlops } from "@/lib/data"
import { FlopWall } from "@/components/flop-wall"

export async function FlopWallWrapper() {
    // Fetch both in parallel
    const [friends, flops] = await Promise.all([getFriends(), getFlops()])

    return <FlopWall friends={friends} allFlops={flops} />
}
