import { NextResponse } from 'next/server'
import { getPlinkSession, getAuthenticatedPlinkClient, plinkMediaServiceUrl } from '@/lib/plink'

export async function GET() {
    const results: Record<string, { pass: boolean; data?: any; error?: string }> = {}

    // Step 1: Auth
    let accessToken: string
    try {
        accessToken = await getPlinkSession()
        results['1_auth'] = { pass: true, data: { tokenLength: accessToken.length } }
    } catch (e: any) {
        results['1_auth'] = { pass: false, error: e.message }
        return NextResponse.json(results)
    }

    // Step 2: Query links table
    let firstLinkId: string | null = null
    try {
        const client = getAuthenticatedPlinkClient()
        const { data, error } = await client
            .from('links')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(5)

        if (error) throw new Error(error.message)
        firstLinkId = data?.[0]?.id ?? null
        results['2_links_query'] = { pass: true, data: { count: data?.length, links: data } }
    } catch (e: any) {
        results['2_links_query'] = { pass: false, error: e.message }
        return NextResponse.json(results)
    }

    // Step 3: Query link_posts + link_post_media
    let firstMediaPath: string | null = null
    try {
        if (!firstLinkId) throw new Error('No links found to test with')

        const client = getAuthenticatedPlinkClient()
        const { data, error } = await client
            .from('link_posts')
            .select('id, link_id, link_post_media(id, type, path, thumbnail_path, mime)')
            .eq('link_id', firstLinkId)
            .limit(5)

        if (error) throw new Error(error.message)

        const allMedia = data?.flatMap(p => p.link_post_media) ?? []
        firstMediaPath = allMedia[0]?.path ?? null
        results['3_media_query'] = { pass: true, data: { postCount: data?.length, mediaCount: allMedia.length, firstMedia: allMedia[0] } }
    } catch (e: any) {
        results['3_media_query'] = { pass: false, error: e.message }
        return NextResponse.json(results)
    }

    // Step 4: Get presigned URL from media service
    let presignedUrl: string | null = null
    try {
        if (!firstMediaPath) throw new Error('No media found to test with')

        const res = await fetch(`${plinkMediaServiceUrl}/media/url/${firstMediaPath}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!res.ok) throw new Error(`Media service returned ${res.status}: ${await res.text()}`)
        const json = await res.json()
        presignedUrl = json.url ?? json.signedUrl ?? null
        results['4_media_service'] = { pass: true, data: { urlPreview: presignedUrl?.substring(0, 100) + '...' } }
    } catch (e: any) {
        results['4_media_service'] = { pass: false, error: e.message }
        return NextResponse.json(results)
    }

    // Step 5: Verify presigned URL actually works
    try {
        if (!presignedUrl) throw new Error('No presigned URL to test')

        const res = await fetch(presignedUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } })
        results['5_s3_access'] = {
            pass: res.ok,
            data: { status: res.status, contentType: res.headers.get('content-type') },
            ...(!res.ok && { error: `Got status ${res.status}` }),
        }
    } catch (e: any) {
        results['5_s3_access'] = { pass: false, error: e.message }
    }

    return NextResponse.json(results, { status: 200 })
}
