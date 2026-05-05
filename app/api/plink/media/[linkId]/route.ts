import { NextResponse } from 'next/server'
import { getPlinkSession, getAuthenticatedPlinkClient, fetchSignedUrlsBatch } from '@/lib/plink'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ linkId: string }> }
) {
    try {
        const { linkId } = await params
        const accessToken = await getPlinkSession()
        const client = getAuthenticatedPlinkClient()

        const { data: media, error } = await client
            .from('link_media')
            .select('id, type, path, thumbnail_path, mime')
            .eq('link_id', linkId)
            .order('captured_at', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true })

        if (error) throw new Error(error.message)
        if (!media || media.length === 0) return NextResponse.json([])

        const keys: string[] = []
        for (const item of media) {
            if (item.path) keys.push(item.path)
            if (item.thumbnail_path) keys.push(item.thumbnail_path)
        }

        const urls = await fetchSignedUrlsBatch(linkId, keys, accessToken)

        const mediaWithUrls = media.map(item => ({
            id: item.id,
            type: item.type,
            url: urls[item.path] ?? null,
            thumbnailUrl: item.thumbnail_path ? (urls[item.thumbnail_path] ?? null) : null,
            mime: item.mime,
        }))

        return NextResponse.json(mediaWithUrls.filter(m => m.url))
    } catch (e: any) {
        console.error('Error fetching plink media:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
