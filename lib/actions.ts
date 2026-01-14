'use server'

import { supabase } from './supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Location } from './types'

export async function createLink(formData: FormData) {
    const purpose = formData.get('purpose') as string
    const duration = parseInt(formData.get('duration') as string)
    const date = formData.get('date') as string // "YYYY-MM-DDTHH:mm"

    // Parse locations JSON from form
    const locationsJson = formData.get('locations') as string
    const locations: Location[] = locationsJson ? JSON.parse(locationsJson) : []

    const attendeesRaw = formData.getAll('attendees') as string[]
    const floppersRaw = formData.getAll('floppers') as string[]

    // Insert Link (without location fields)
    const { data: link, error: linkError } = await supabase
        .from('links')
        .insert({
            purpose,
            duration_minutes: duration,
            date: new Date(date).toISOString()
        })
        .select()
        .single()

    if (linkError) {
        console.error('Error creating link:', linkError)
        throw new Error('Failed to create link')
    }

    // Insert Locations
    if (locations.length > 0) {
        const locationRecords = locations.map(loc => ({
            link_id: link.id,
            location_name: loc.location_name,
            location_lat: loc.location_lat,
            location_lng: loc.location_lng
        }))

        const { error: locationsError } = await supabase
            .from('link_locations')
            .insert(locationRecords)

        if (locationsError) {
            console.error('Error adding locations:', locationsError)
        }
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
        }
    }

    revalidatePath('/')
    revalidatePath('/history')
    return { success: true }
}

export async function updateLink(id: string, formData: FormData) {
    const purpose = formData.get('purpose') as string
    const duration = parseInt(formData.get('duration') as string)
    const date = formData.get('date') as string

    // Parse locations JSON from form
    const locationsJson = formData.get('locations') as string
    const locations: Location[] = locationsJson ? JSON.parse(locationsJson) : []

    const attendeesRaw = formData.getAll('attendees') as string[]
    const floppersRaw = formData.getAll('floppers') as string[]

    // Update Link (without location fields)
    const { error: linkError } = await supabase
        .from('links')
        .update({
            purpose,
            duration_minutes: duration,
            date: new Date(date).toISOString()
        })
        .eq('id', id)

    if (linkError) {
        console.error('Error updating link:', linkError)
        throw new Error('Failed to update link')
    }

    // Update locations: Delete all and re-insert
    const { error: deleteLocationsError } = await supabase
        .from('link_locations')
        .delete()
        .eq('link_id', id)

    if (deleteLocationsError) {
        console.error('Error clearing locations for update:', deleteLocationsError)
    }

    if (locations.length > 0) {
        const locationRecords = locations.map(loc => ({
            link_id: id,
            location_name: loc.location_name,
            location_lat: loc.location_lat,
            location_lng: loc.location_lng
        }))

        await supabase.from('link_locations').insert(locationRecords)
    }

    // Update members: Delete all and re-insert
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

export async function createLinkReview(linkId: string, profileId: string, rating: number, comment?: string) {
    const { error } = await supabase
        .from('link_reviews')
        .insert({
            link_id: linkId,
            profile_id: profileId,
            rating,
            comment: comment || null
        })

    if (error) {
        console.error('Error creating review:', error)
        throw new Error('Failed to create review')
    }

    revalidatePath('/history')
    return { success: true }
}

export async function saveLinkImage(linkId: string, storagePath: string, fileName: string) {
    const { data, error } = await supabase
        .from('link_images')
        .insert({
            link_id: linkId,
            storage_path: storagePath,
            file_name: fileName
        })
        .select('id')
        .single()

    if (error) {
        console.error('Error saving image reference:', error)
        throw new Error('Failed to save image')
    }

    revalidatePath('/history')
    return { success: true, id: data.id }
}

export async function deleteLinkImage(imageId: string, storagePath: string) {
    // Delete from storage
    const { error: storageError } = await supabase
        .storage
        .from('link-images')
        .remove([storagePath])

    if (storageError) {
        console.error('Error deleting from storage:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
        .from('link_images')
        .delete()
        .eq('id', imageId)

    if (dbError) {
        console.error('Error deleting image reference:', dbError)
        throw new Error('Failed to delete image')
    }

    revalidatePath('/history')
    return { success: true }
}
