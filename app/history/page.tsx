import { getRecentLinks, getFriends } from "@/lib/data"
import { supabase } from "@/lib/supabase"
import { HistoryTable } from "@/components/history-table"

async function getAllLinks() {
    const { data, error } = await supabase
        .from('links')
        .select(`
      *,
      link_members (
        profile_id,
        is_flop,
        flop_reason,
        profiles (name)
      )
    `)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching all links:', error)
        return []
    }
    return data
}

export const revalidate = 0;

export default async function HistoryPage() {
    const links = await getAllLinks()
    const friends = await getFriends()

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-bold tracking-tight">Link History</h2>
            <HistoryTable links={links} friends={friends} />
        </div>
    )
}
