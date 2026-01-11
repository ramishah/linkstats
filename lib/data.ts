import { supabase } from './supabase'

export async function getFriends() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching friends:', error)
        return []
    }
    return data
}

export async function getRecentLinks() {
    const { data, error } = await supabase
        .from('links')
        .select(`
      *,
      link_members (
        profile_id,
        is_flop,
        profiles (name)
      )
    `)
        .order('date', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching recent links:', error)
        return []
    }
    return data
}

export async function getDashboardStats() {
    // Fetch all links to calculate stats
    const { data: links, error: linksError } = await supabase
        .from('links')
        .select('duration_minutes, created_at')

    const { data: members, error: membersError } = await supabase
        .from('link_members')
        .select('is_flop, profile_id, profiles(name)')

    if (linksError || membersError) {
        console.error('Error fetching stats data', linksError, membersError)
        return {
            totalLinks: 0,
            avgDuration: 0,
            flopRate: 0,
            topFlopper: 'N/A'
        }
    }

    const totalLinks = links.length

    const avgDuration = totalLinks > 0
        ? Math.round(links.reduce((acc, curr) => acc + curr.duration_minutes, 0) / totalLinks)
        : 0

    const totalMembers = members.length
    const totalFlops = members.filter(m => m.is_flop).length
    const flopRate = totalMembers > 0 ? Math.round((totalFlops / totalMembers) * 100) : 0

    // Calculate top flopper
    const flopsByPerson: Record<string, number> = {}
    members.forEach(m => {
        if (m.is_flop && m.profiles) {
            // @ts-ignore
            const name = m.profiles.name
            flopsByPerson[name] = (flopsByPerson[name] || 0) + 1
        }
    })

    let topFlopper = 'None'
    let maxFlops = 0
    Object.entries(flopsByPerson).forEach(([name, count]) => {
        if (count > maxFlops) {
            maxFlops = count
            topFlopper = name
        }
    })

    return {
        totalLinks,
        avgDuration,
        flopRate,
        topFlopper
    }
}
