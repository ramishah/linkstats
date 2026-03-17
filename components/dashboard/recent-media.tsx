"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ImageIcon, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbox, type LightboxMedia } from "@/components/ui/lightbox"
import { Skeleton } from "@/components/ui/skeleton"

interface RecentMediaItem {
    id: string
    storage_path: string
    file_name: string
    created_at: string
    links: { id: string; purpose: string | null; date: string } | null
}

interface PlinkLink {
    id: string
    date: string
    purpose: string | null
    plink_link_id: string
}

interface UnifiedMediaItem {
    id: string
    source: 'local' | 'plink'
    thumbnailUrl: string
    fullUrl: string
    type: 'image' | 'video'
    date: string
    purpose: string | null
}

// Client-side cache for plink media (separate instance from view-link-dialog)
const plinkMediaCache = new Map<string, { data: any[]; fetchedAt: number }>()
const PLINK_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

function getImageUrl(storagePath: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/link-images/${storagePath}`
}

export function RecentMedia({ media, plinkLinks }: { media: RecentMediaItem[]; plinkLinks: PlinkLink[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [plinkItems, setPlinkItems] = useState<UnifiedMediaItem[]>([])
    const [plinkLoading, setPlinkLoading] = useState(plinkLinks.length > 0)
    const fetchingRef = useRef(false)

    const fetchPlinkMedia = useCallback(async (showLoading: boolean) => {
        if (plinkLinks.length === 0 || fetchingRef.current) return
        fetchingRef.current = true
        if (showLoading) setPlinkLoading(true)

        console.log('[RecentMedia] fetchPlinkMedia called', { showLoading, plinkLinksCount: plinkLinks.length })

        const now = Date.now()
        const toFetch: PlinkLink[] = []
        const fromCache: UnifiedMediaItem[] = []

        for (const link of plinkLinks) {
            const cached = plinkMediaCache.get(link.plink_link_id)
            if (cached && now - cached.fetchedAt < PLINK_CACHE_TTL) {
                const age = Math.round((now - cached.fetchedAt) / 1000)
                console.log(`[RecentMedia] Cache HIT for ${link.plink_link_id} (age: ${age}s, items: ${cached.data.length})`)
                fromCache.push(...normalizePlinkMedia(cached.data, link))
            } else {
                console.log(`[RecentMedia] Cache MISS for ${link.plink_link_id}`, cached ? `(expired, age: ${Math.round((now - cached.fetchedAt) / 1000)}s)` : '(no entry)')
                toFetch.push(link)
            }
        }

        if (toFetch.length === 0) {
            console.log(`[RecentMedia] All from cache, ${fromCache.length} items total`)
            setPlinkItems(fromCache)
            setPlinkLoading(false)
            fetchingRef.current = false
            return
        }

        console.log(`[RecentMedia] Fetching ${toFetch.length} plink links...`)

        const results = await Promise.allSettled(
            toFetch.map(async (link) => {
                const url = `/api/plink/media/${link.plink_link_id}`
                console.log(`[RecentMedia] Fetching ${url}`)
                const res = await fetch(url)
                console.log(`[RecentMedia] Response for ${link.plink_link_id}: status=${res.status}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    console.log(`[RecentMedia] Got ${data.length} media items for ${link.plink_link_id}`)
                    plinkMediaCache.set(link.plink_link_id, { data, fetchedAt: Date.now() })
                    return { link, data }
                }
                console.warn(`[RecentMedia] Unexpected response for ${link.plink_link_id}:`, data)
                return { link, data: [] }
            })
        )

        const fetchedItems: UnifiedMediaItem[] = []
        for (const result of results) {
            if (result.status === 'fulfilled') {
                fetchedItems.push(...normalizePlinkMedia(result.value.data, result.value.link))
            } else {
                console.error(`[RecentMedia] Fetch failed:`, result.reason)
            }
        }

        console.log(`[RecentMedia] Done. fromCache=${fromCache.length}, fetched=${fetchedItems.length}, total=${fromCache.length + fetchedItems.length}`)
        setPlinkItems([...fromCache, ...fetchedItems])
        setPlinkLoading(false)
        fetchingRef.current = false
    }, [plinkLinks])

    // Fetch on mount
    useEffect(() => {
        fetchPlinkMedia(true)
    }, [fetchPlinkMedia])

    // Auto-refresh before presigned URLs expire
    useEffect(() => {
        if (plinkLinks.length === 0) return
        console.log(`[RecentMedia] Setting up auto-refresh interval (${PLINK_CACHE_TTL / 1000}s)`)
        const interval = setInterval(() => {
            console.log('[RecentMedia] Auto-refresh triggered, invalidating cache')
            for (const link of plinkLinks) {
                plinkMediaCache.delete(link.plink_link_id)
            }
            fetchPlinkMedia(false)
        }, PLINK_CACHE_TTL)
        return () => clearInterval(interval)
    }, [plinkLinks, fetchPlinkMedia])

    // Re-fetch on image load error (handles edge case where URLs expired between intervals)
    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const src = e.currentTarget.src
        console.warn(`[RecentMedia] Image load error, URL: ${src.substring(0, 80)}...`)
        console.log('[RecentMedia] Invalidating cache and re-fetching')
        for (const link of plinkLinks) {
            plinkMediaCache.delete(link.plink_link_id)
        }
        fetchPlinkMedia(false)
    }, [plinkLinks, fetchPlinkMedia])

    // Normalize local images into unified items
    const localItems: UnifiedMediaItem[] = media.map(item => ({
        id: item.id,
        source: 'local',
        thumbnailUrl: getImageUrl(item.storage_path),
        fullUrl: getImageUrl(item.storage_path),
        type: 'image',
        date: item.links?.date || item.created_at,
        purpose: item.links?.purpose || null,
    }))

    // Merge, sort by date descending, take top 12
    const unified = [...localItems, ...plinkItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 32)

    const lightboxMedia: LightboxMedia[] = unified.map(item => ({
        url: item.fullUrl,
        type: item.type,
    }))

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Recent Media
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!plinkLoading && unified.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No photos yet.</p>
                    ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                            {unified.map((item, idx) => (
                                <div
                                    key={`${item.source}-${item.id}`}
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-800 cursor-pointer"
                                    onClick={() => setLightboxIndex(idx)}
                                >
                                    {item.type === 'video' ? (
                                        <>
                                            <img
                                                src={item.thumbnailUrl}
                                                alt="Video"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                onError={item.source === 'plink' ? handleImageError : undefined}
                                            />
                                            <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                <div className="bg-black/60 rounded-full p-1.5">
                                                    <Play className="h-4 w-4 text-white fill-white" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <img
                                            src={item.thumbnailUrl}
                                            alt="Photo"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            onError={item.source === 'plink' ? handleImageError : undefined}
                                        />
                                    )}
                                    {item.purpose && (
                                        <div className="absolute inset-0 z-10 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                            <span className="text-xs text-white line-clamp-2">{item.purpose}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {plinkLoading && Array.from({ length: 8 }).map((_, i) => (
                                <Skeleton key={`plink-skeleton-${i}`} className="aspect-square w-full rounded-lg" />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {lightboxIndex !== null && (
                <Lightbox
                    media={lightboxMedia}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </>
    )
}

function normalizePlinkMedia(data: any[], link: PlinkLink): UnifiedMediaItem[] {
    return data.map((m: any) => ({
        id: m.id,
        source: 'plink' as const,
        thumbnailUrl: m.thumbnailUrl || m.url,
        fullUrl: m.url,
        type: (m.type === 'video' || m.mime?.startsWith('video/')) ? 'video' as const : 'image' as const,
        date: link.date,
        purpose: link.purpose,
    }))
}
