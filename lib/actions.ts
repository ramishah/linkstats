'use server'

import { supabase } from './supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createLink(formData: FormData) {
    const purpose = formData.get('purpose') as string
    const location = formData.get('location') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string
    const duration = parseInt(formData.get('duration') as string)
    const date = formData.get('date') as string // "YYYY-MM-DDTHH:mm"

    const attendeesRaw = formData.getAll('attendees') as string[]
    const floppersRaw = formData.getAll('floppers') as string[]

    // Insert Link
    const { data: link, error: linkError } = await supabase
        .from('links')
        .insert({
            purpose,
            location_name: location,
            location_lat: latitude ? parseFloat(latitude) : null,
            location_lng: longitude ? parseFloat(longitude) : null,
            duration_minutes: duration,
            date: new Date(date).toISOString()
        })
        .select()
        .single()

    if (linkError) {
        console.error('Error creating link:', linkError)
        throw new Error('Failed to create link')
    }

    // Insert Members
    const members: { link_id: string, profile_id: string, is_flop: boolean, flop_reason?: string | null }[] = []

    // Add attendees (is_flop = false)
    attendeesRaw.forEach(id => {
        members.push({
            link_id: link.id,
            profile_id: id,
            is_flop: false
        })
    })

    // Add floppers (is_flop = true)
    floppersRaw.forEach(id => {
        const reason = formData.get(`flop_reason_${id}`) as string
        members.push({
            link_id: link.id,
            profile_id: id,
            is_flop: true,
            flop_reason: reason || null
        })
    })

    if (members.length > 0) {
        const { error: membersError } = await supabase
            .from('link_members')
            .insert(members)

        if (membersError) {
            console.error('Error adding members:', membersError)
            // Cleanup link if members fail? Or just warn.
        }
    }

    revalidatePath('/')
    revalidatePath('/history')
    return { success: true }
}

export async function updateLink(id: string, formData: FormData) {
    const purpose = formData.get('purpose') as string
    const location = formData.get('location') as string
    const latitude = formData.get('latitude') as string
    const longitude = formData.get('longitude') as string
    const duration = parseInt(formData.get('duration') as string)
    const date = formData.get('date') as string

    const attendeesRaw = formData.getAll('attendees') as string[]
    const floppersRaw = formData.getAll('floppers') as string[]

    // Update Link
    const { error: linkError } = await supabase
        .from('links')
        .update({
            purpose,
            location_name: location,
            location_lat: latitude ? parseFloat(latitude) : null,
            location_lng: longitude ? parseFloat(longitude) : null,
            duration_minutes: duration,
            date: new Date(date).toISOString()
        })
        .eq('id', id)

    if (linkError) {
        console.error('Error updating link:', linkError)
        throw new Error('Failed to update link')
    }

    // Update members: Delete all and re-insert is easiest
    const { error: deleteError } = await supabase
        .from('link_members')
        .delete()
        .eq('link_id', id)

    if (deleteError) {
        console.error('Error clearing members for update:', deleteError)
    }

    const members: { link_id: string, profile_id: string, is_flop: boolean, flop_reason?: string | null }[] = []
    attendeesRaw.forEach(pid => members.push({ link_id: id, profile_id: pid, is_flop: false }))
    floppersRaw.forEach(pid => {
        const reason = formData.get(`flop_reason_${pid}`) as string
        members.push({ link_id: id, profile_id: pid, is_flop: true, flop_reason: reason || null })
    })

    if (members.length > 0) {
        await supabase.from('link_members').insert(members)
    }

    revalidatePath('/')
    revalidatePath('/history')
    return { success: true }
}

export async function deleteLink(id: string) {
    const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting link:', error)
        throw new Error('Failed to delete link')
    }

    revalidatePath('/')
    revalidatePath('/history')
}

export async function createSignificantLocation(address: string, label: string) {
    const { error } = await supabase
        .from('significant_locations')
        .insert({
            address,
            label,
        })

    if (error) {
        console.error('Error creating significant location:', error)
        throw new Error('Failed to create significant location')
    }

    revalidatePath('/history')
    return { success: true }
}

export async function updateSignificantLocation(address: string, newLabel: string) {
    const { error } = await supabase
        .from('significant_locations')
        .update({ label: newLabel })
        .eq('address', address)

    if (error) {
        console.error('Error updating significant location:', error)
        throw new Error('Failed to update significant location')
    }

    revalidatePath('/history')
    return { success: true }
}

export async function deleteSignificantLocation(address: string) {
    const { error } = await supabase
        .from('significant_locations')
        .delete()
        .eq('address', address)

    if (error) {
        console.error('Error deleting significant location:', error)
        throw new Error('Failed to delete significant location')
    }

    revalidatePath('/history')
    return { success: true }
}
