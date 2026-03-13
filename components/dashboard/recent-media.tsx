"use client"

import { useState, useEffect } from "react"
import { ImageIcon, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbox, type LightboxMedia } from "@/components/ui/lightbox"
import { RecentMediaSkeleton } from "@/components/skeletons"

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

    // Fetch plink media on mount
    useEffect(() => {
        if (plinkLinks.length === 0) return

        let cancelled = false

        async function fetchPlinkMedia() {
            const now = Date.now()
            const toFetch: PlinkLink[] = []
            const fromCache: UnifiedMediaItem[] = []

            for (const link of plinkLinks) {
                const cached = plinkMediaCache.get(link.plink_link_id)
                if (cached && now - cached.fetchedAt < PLINK_CACHE_TTL) {
                    fromCache.push(...normalizePlinkMedia(cached.data, link))
                } else {
                    toFetch.push(link)
                }
            }

            if (toFetch.length === 0) {
                if (!cancelled) {
                    setPlinkItems(fromCache)
                    setPlinkLoading(false)
                }
                return
            }

            const results = await Promise.allSettled(
                toFetch.map(async (link) => {
                    const res = await fetch(`/api/plink/media/${link.plink_link_id}`)
                    const data = await res.json()
                    if (Array.isArray(data)) {
                        plinkMediaCache.set(link.plink_link_id, { data, fetchedAt: Date.now() })
                        return { link, data }
                    }
                    return { link, data: [] }
                })
            )

            if (cancelled) return

            const fetchedItems: UnifiedMediaItem[] = []
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    fetchedItems.push(...normalizePlinkMedia(result.value.data, result.value.link))
                }
            }

            setPlinkItems([...fromCache, ...fetchedItems])
            setPlinkLoading(false)
        }

        fetchPlinkMedia()

        return () => { cancelled = true }
    }, [plinkLinks])

    // Show skeleton while plink data is loading
    if (plinkLoading) {
        return <RecentMediaSkeleton />
    }

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
        .slice(0, 12)

    const lightboxMedia: LightboxMedia[] = unified.map(item => ({
        url: item.fullUrl,
        type: item.type,
    }))

    if (unified.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Recent Media
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No photos yet.</p>
                </CardContent>
            </Card>
        )
    }

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
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-black/60 rounded-full p-2">
                                                <Play className="h-6 w-6 text-white fill-white" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <img
                                        src={item.thumbnailUrl}
                                        alt="Photo"
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                )}
                                {item.purpose && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <span className="text-xs text-white line-clamp-2">{item.purpose}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
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
