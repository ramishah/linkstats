import { getRecentLinks, getFriends, getDistinctLocations, getSignificantLocations } from "@/lib/data"
import { supabase } from "@/lib/supabase"
import { HistoryTable } from "@/components/history-table"
import { ManageSignificantLocationsDialog } from "@/components/add-significant-location-dialog"

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
      ),
      link_locations (
        id,
        location_name,
        location_lat,
        location_lng
      ),
      link_reviews (
        id,
        rating,
        comment,
        created_at,
        profiles (id, name)
      ),
      link_images (
        id,
        storage_path,
        file_name,
        created_at
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
    const distinctLocations = await getDistinctLocations()
    const significantLocations = await getSignificantLocations()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Link History</h2>
                <ManageSignificantLocationsDialog distinctLocations={distinctLocations} significantLocations={significantLocations} />
            </div>
            <HistoryTable links={links} friends={friends} significantLocations={significantLocations} />
        </div>
    )
}
