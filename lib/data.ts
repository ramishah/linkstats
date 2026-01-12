import { supabase } from './supabase'

export async function getFriends() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*, is_active')
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
        .select('is_flop, profile_id, profiles(name, is_active)')

    const { count: activeFriendsCount, error: activeFriendsError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    if (linksError || membersError || activeFriendsError) {
        console.error('Error fetching stats data', linksError, membersError, activeFriendsError)
        return {
            totalLinks: 0,
            avgDuration: 0,
            avgAttendance: 0,
            topFlopper: 'N/A',
            attendanceData: []
        }
    }

    const totalLinks = links.length

    const avgDuration = totalLinks > 0
        ? Math.round(links.reduce((acc, curr) => acc + curr.duration_minutes, 0) / totalLinks)
        : 0

    // Filter to only include currently active members for stats
    // @ts-ignore
    const activeMembersHistory = members.filter(m => m.profiles?.is_active !== false)

    const totalMembers = activeMembersHistory.length

    // Calculate Average Attendance
    // Formula: (Total Active Attendees / (Total Links * Total Active Friends)) * 100
    const totalActiveAttendees = activeMembersHistory.filter(m => !m.is_flop).length
    const totalPossibleAttendance = (totalLinks * (activeFriendsCount || 0))

    const avgAttendance = totalPossibleAttendance > 0
        ? Math.round((totalActiveAttendees / totalPossibleAttendance) * 100)
        : 0

    // Calculate top flopper
    const flopsByPerson: Record<string, number> = {}
    activeMembersHistory.forEach(m => {
        // @ts-ignore
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

    // Calculate attendance for Overview chart
    const attendanceByPerson: Record<string, number> = {}
    activeMembersHistory.forEach(m => {
        // @ts-ignore
        if (!m.is_flop && m.profiles) {
            // @ts-ignore
            const name = m.profiles.name
            attendanceByPerson[name] = (attendanceByPerson[name] || 0) + 1
        }
    })

    const attendanceData = Object.entries(attendanceByPerson)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)

    return {
        totalLinks,
        avgDuration,
        avgAttendance,
        topFlopper,
        attendanceData
    }
}

export async function getFlops() {
    const { data, error } = await supabase
        .from('link_members')
        .select(`
      profile_id,
      flop_reason,
      profiles (name),
      links (id, purpose, date)
    `)
        .eq('is_flop', true)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching flops:', error)
        return []
    }

    // Flatten the structure for easier consumption
    return data.map((item: any) => ({
        ...item,
        name: item.profiles?.name,
        link_date: item.links?.date,
        purpose: item.links?.purpose
    }))
}
