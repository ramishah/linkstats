import { cache } from 'react'
import { supabase } from './supabase'
import { FlattenedLinkLocation, UnifiedFlop } from './types'

// Wrap data fetching functions with React cache() to deduplicate calls within a request
export const getFriends = cache(async function getFriends() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*, is_active')
        .order('name')

    if (error) {
        console.error('Error fetching friends:', error)
        return []
    }
    return data
})

export async function getRecentLinks() {
    const { data, error } = await supabase
        .from('links')
        .select(`
      *,
      link_members (
        profile_id,
        is_flop,
        profiles (name)
      ),
      link_locations (
        location_name,
        location_label,
        location_lat,
        location_lng
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

export const getDashboardStats = cache(async function getDashboardStats() {
    // Fetch all data in parallel for better performance
    const [linksResult, membersResult, activeFriendsResult, standaloneFlopsResult] = await Promise.all([
        supabase.from('links').select('duration_minutes, created_at'),
        supabase.from('link_members').select('is_flop, profile_id, profiles(name, is_active)'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('flops').select('profile_id, profiles(name, is_active)')
    ])

    const { data: links, error: linksError } = linksResult
    const { data: members, error: membersError } = membersResult
    const { count: activeFriendsCount, error: activeFriendsError } = activeFriendsResult
    const { data: standaloneFlops, error: standaloneFlopsError } = standaloneFlopsResult

    if (linksError || membersError || activeFriendsError || standaloneFlopsError) {
        console.error('Error fetching stats data', linksError, membersError, activeFriendsError, standaloneFlopsError)
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

    // Calculate top flopper from link_members
    const flopsByPerson: Record<string, number> = {}
    activeMembersHistory.forEach(m => {
        // @ts-ignore
        if (m.is_flop && m.profiles) {
            // @ts-ignore
            const name = m.profiles.name
            flopsByPerson[name] = (flopsByPerson[name] || 0) + 1
        }
    })

    // Add standalone flops to the count
    if (standaloneFlops) {
        standaloneFlops.forEach((f: any) => {
            if (f.profiles?.is_active !== false && f.profiles?.name) {
                const name = f.profiles.name
                flopsByPerson[name] = (flopsByPerson[name] || 0) + 1
            }
        })
    }

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
})

export async function getFlops(): Promise<UnifiedFlop[]> {
    // Fetch flops from link_members (attached to links)
    const { data: linkMemberFlops, error: linkMemberError } = await supabase
        .from('link_members')
        .select(`
            profile_id,
            flop_reason,
            profiles (name),
            links (id, purpose, date)
        `)
        .eq('is_flop', true)

    if (linkMemberError) {
        console.error('Error fetching link_member flops:', linkMemberError)
    }

    // Fetch standalone flops from the flops table
    const { data: standaloneFlops, error: standaloneError } = await supabase
        .from('flops')
        .select(`
            profile_id,
            flop_date,
            reason,
            is_link_ender,
            link_id,
            profiles (name),
            links (purpose, date)
        `)

    if (standaloneError) {
        console.error('Error fetching standalone flops:', standaloneError)
    }

    // Unify the data
    const unified: UnifiedFlop[] = []

    // Add link_member flops
    if (linkMemberFlops) {
        for (const item of linkMemberFlops as any[]) {
            unified.push({
                profile_id: item.profile_id,
                name: item.profiles?.name || 'Unknown',
                flop_date: item.links?.date || '',
                purpose: item.links?.purpose || null,
                reason: item.flop_reason || null,
                is_link_ender: false,
                is_standalone: false
            })
        }
    }

    // Add standalone flops (from flops table)
    if (standaloneFlops) {
        for (const item of standaloneFlops as any[]) {
            // Only add if it's truly standalone (no link_id) or has a link_id
            unified.push({
                profile_id: item.profile_id,
                name: item.profiles?.name || 'Unknown',
                flop_date: item.link_id ? item.links?.date : item.flop_date,
                purpose: item.link_id ? item.links?.purpose : null,
                reason: item.reason || null,
                is_link_ender: item.is_link_ender || false,
                is_standalone: !item.link_id
            })
        }
    }

    // Sort by date descending
    unified.sort((a, b) => {
        const dateA = a.flop_date ? new Date(a.flop_date).getTime() : 0
        const dateB = b.flop_date ? new Date(b.flop_date).getTime() : 0
        return dateB - dateA
    })

    return unified
}

export async function getLinksWithLocations(): Promise<FlattenedLinkLocation[]> {
    const { data, error } = await supabase
        .from('links')
        .select(`
            id,
            purpose,
            date,
            link_locations (
                location_name,
                location_label,
                location_lat,
                location_lng
            )
        `)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching links with locations:', error)
        return []
    }

    // Flatten: one entry per location for map display
    const flattened: FlattenedLinkLocation[] = []
    for (const link of data) {
        for (const loc of (link.link_locations as any[]) || []) {
            flattened.push({
                id: link.id,
                purpose: link.purpose,
                location_name: loc.location_name,
                location_label: loc.location_label || undefined,
                location_lat: loc.location_lat,
                location_lng: loc.location_lng,
                date: link.date
            })
        }
    }

    return flattened
}

export const getSignificantLocations = cache(async function getSignificantLocations() {
    const { data, error } = await supabase
        .from('significant_locations')
        .select('*')

    if (error) {
        console.error('Error fetching significant locations:', error)
        return []
    }
    return data
})

export const getDistinctLocations = cache(async function getDistinctLocations() {
    const { data, error } = await supabase
        .from('link_locations')
        .select('location_name')
        .order('location_name')

    if (error) {
        console.error('Error fetching distinct locations:', error)
        return []
    }

    const uniqueLocations = Array.from(new Set(data.map(item => item.location_name)))
    return uniqueLocations as string[]
})

export const getAllLinkLocations = cache(async function getAllLinkLocations() {
    const { data, error } = await supabase
        .from('link_locations')
        .select('location_name, location_label, location_lat, location_lng')

    if (error) {
        console.error('Error fetching link locations:', error)
        return []
    }

    // Deduplicate by location_name, keeping first occurrence
    const seen = new Set<string>()
    const unique = data.filter(loc => {
        if (seen.has(loc.location_name)) return false
        seen.add(loc.location_name)
        return true
    })

    return unique
})
