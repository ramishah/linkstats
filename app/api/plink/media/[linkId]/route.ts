import { NextResponse } from 'next/server'
import { getPlinkSession, getAuthenticatedPlinkClient, plinkMediaServiceUrl } from '@/lib/plink'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ linkId: string }> }
) {
    try {
        const { linkId } = await params
        const accessToken = await getPlinkSession()
        const client = getAuthenticatedPlinkClient()

        // Fetch posts and their media for this link
        const { data: posts, error } = await client
            .from('link_posts')
            .select('id, link_post_media(id, type, path, thumbnail_path, mime)')
            .eq('link_id', linkId)

        if (error) throw new Error(error.message)

        const allMedia = posts?.flatMap(p => p.link_post_media) ?? []

        // Get presigned URLs for each media item
        const mediaWithUrls = await Promise.all(
            allMedia.map(async (item: any) => {
                let url: string | null = null
                let thumbnailUrl: string | null = null

                try {
                    const res = await fetch(`${plinkMediaServiceUrl}/media/url/${item.path}`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    })
                    if (res.ok) {
                        const json = await res.json()
                        url = json.url ?? json.signedUrl ?? null
                    }
                } catch {}

                if (item.thumbnail_path) {
                    try {
                        const res = await fetch(`${plinkMediaServiceUrl}/media/url/${item.thumbnail_path}`, {
                            headers: { Authorization: `Bearer ${accessToken}` },
                        })
                        if (res.ok) {
                            const json = await res.json()
                            thumbnailUrl = json.url ?? json.signedUrl ?? null
                        }
                    } catch {}
                }

                return {
                    id: item.id,
                    type: item.type,
                    url,
                    thumbnailUrl,
                    mime: item.mime,
                }
            })
        )

        return NextResponse.json(mediaWithUrls.filter(m => m.url))
    } catch (e: any) {
        console.error('Error fetching plink media:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
