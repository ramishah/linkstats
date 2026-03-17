"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ImageIcon, Play, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Lightbox, type LightboxMedia } from "@/components/ui/lightbox"
import { Skeleton } from "@/components/ui/skeleton"

interface LinkImage {
    id: string
    storage_path: string
    file_name: string
    created_at: string
}

interface LinkWithMedia {
    id: string
    date: string
    purpose: string | null
    plink_link_id: string | null
    link_images: LinkImage[]
}

interface UnifiedMediaItem {
    id: string
    source: 'local' | 'plink'
    thumbnailUrl: string
    fullUrl: string
    type: 'image' | 'video'
    linkId: string
}

interface TimelineGroup {
    linkId: string
    date: string
    purpose: string | null
    media: UnifiedMediaItem[]
}

// Client-side cache for plink media
const plinkMediaCache = new Map<string, { data: any[]; fetchedAt: number }>()
const PLINK_CACHE_TTL = 10 * 60 * 1000

function getImageUrl(storagePath: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/link-images/${storagePath}`
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function normalizePlinkMedia(data: any[], linkId: string): UnifiedMediaItem[] {
    return data.map((m: any) => ({
        id: m.id,
        source: 'plink' as const,
        thumbnailUrl: m.thumbnailUrl || m.url,
        fullUrl: m.url,
        type: (m.type === 'video' || m.mime?.startsWith('video/')) ? 'video' as const : 'image' as const,
        linkId,
    }))
}

export function AllMedia({ linksWithMedia }: { linksWithMedia: LinkWithMedia[] }) {
    const [plinkMediaByLink, setPlinkMediaByLink] = useState<Record<string, UnifiedMediaItem[]>>({})
    const [plinkLoading, setPlinkLoading] = useState(false)
    const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
    const [linkFilter, setLinkFilter] = useState<string | null>(null)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const fetchingRef = useRef(false)

    // Identify plink-connected links
    const plinkLinks = useMemo(
        () => linksWithMedia.filter(l => l.plink_link_id),
        [linksWithMedia]
    )

    const fetchPlinkMedia = useCallback(async (showLoading: boolean) => {
        if (plinkLinks.length === 0 || fetchingRef.current) return
        fetchingRef.current = true
        if (showLoading) setPlinkLoading(true)

        console.log('[AllMedia] fetchPlinkMedia called', { showLoading, count: plinkLinks.length })

        const now = Date.now()
        const toFetch: LinkWithMedia[] = []
        const fromCache: Record<string, UnifiedMediaItem[]> = {}

        for (const link of plinkLinks) {
            const cached = plinkMediaCache.get(link.plink_link_id!)
            if (cached && now - cached.fetchedAt < PLINK_CACHE_TTL) {
                fromCache[link.id] = normalizePlinkMedia(cached.data, link.id)
            } else {
                toFetch.push(link)
            }
        }

        if (toFetch.length === 0) {
            setPlinkMediaByLink(fromCache)
            setPlinkLoading(false)
            fetchingRef.current = false
            return
        }

        console.log(`[AllMedia] Fetching ${toFetch.length} plink links...`)

        const results = await Promise.allSettled(
            toFetch.map(async (link) => {
                const res = await fetch(`/api/plink/media/${link.plink_link_id}`)
                console.log(`[AllMedia] Response for ${link.plink_link_id}: status=${res.status}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    plinkMediaCache.set(link.plink_link_id!, { data, fetchedAt: Date.now() })
                    return { linkId: link.id, data }
                }
                console.warn(`[AllMedia] Unexpected response for ${link.plink_link_id}:`, data)
                return { linkId: link.id, data: [] }
            })
        )

        const fetched: Record<string, UnifiedMediaItem[]> = { ...fromCache }
        for (const result of results) {
            if (result.status === 'fulfilled') {
                fetched[result.value.linkId] = normalizePlinkMedia(result.value.data, result.value.linkId)
            } else {
                console.error(`[AllMedia] Fetch failed:`, result.reason)
            }
        }

        setPlinkMediaByLink(fetched)
        setPlinkLoading(false)
        fetchingRef.current = false
    }, [plinkLinks])

    // Fetch on mount
    useEffect(() => {
        if (plinkLinks.length > 0) {
            setPlinkLoading(true)
            fetchPlinkMedia(true)
        }
    }, [fetchPlinkMedia, plinkLinks.length])

    // Auto-refresh before presigned URLs expire
    useEffect(() => {
        if (plinkLinks.length === 0) return
        const interval = setInterval(() => {
            console.log('[AllMedia] Auto-refresh triggered')
            for (const link of plinkLinks) {
                plinkMediaCache.delete(link.plink_link_id!)
            }
            fetchPlinkMedia(false)
        }, PLINK_CACHE_TTL)
        return () => clearInterval(interval)
    }, [plinkLinks, fetchPlinkMedia])

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        console.warn(`[AllMedia] Image load error: ${e.currentTarget.src.substring(0, 80)}...`)
        for (const link of plinkLinks) {
            plinkMediaCache.delete(link.plink_link_id!)
        }
        fetchPlinkMedia(false)
    }, [plinkLinks, fetchPlinkMedia])

    // Build timeline groups
    const allGroups: TimelineGroup[] = useMemo(() => {
        return linksWithMedia.map(link => {
            const localMedia: UnifiedMediaItem[] = link.link_images.map(img => ({
                id: img.id,
                source: 'local' as const,
                thumbnailUrl: getImageUrl(img.storage_path),
                fullUrl: getImageUrl(img.storage_path),
                type: 'image' as const,
                linkId: link.id,
            }))
            const plink = plinkMediaByLink[link.id] || []
            return {
                linkId: link.id,
                date: link.date,
                purpose: link.purpose,
                media: [...localMedia, ...plink],
            }
        })
    }, [linksWithMedia, plinkMediaByLink])

    // Apply filters
    const filteredGroups = useMemo(() => {
        let groups = allGroups

        if (linkFilter) {
            groups = groups.filter(g => g.linkId === linkFilter)
        }

        if (typeFilter !== 'all') {
            groups = groups
                .map(g => ({ ...g, media: g.media.filter(m => m.type === typeFilter) }))
                .filter(g => g.media.length > 0)
        } else {
            // Still filter out groups with no media (unless plink is loading and they have a plink connection)
            groups = groups.filter(g => {
                if (g.media.length > 0) return true
                if (plinkLoading) {
                    const link = linksWithMedia.find(l => l.id === g.linkId)
                    return !!link?.plink_link_id
                }
                return false
            })
        }

        return groups
    }, [allGroups, typeFilter, linkFilter, plinkLoading, linksWithMedia])

    // Flat media array for lightbox
    const allVisibleMedia = useMemo(
        () => filteredGroups.flatMap(g => g.media),
        [filteredGroups]
    )

    const lightboxMedia: LightboxMedia[] = useMemo(
        () => allVisibleMedia.map(item => ({ url: item.fullUrl, type: item.type })),
        [allVisibleMedia]
    )

    // Compute global lightbox index for a media item
    function getGlobalIndex(groupIdx: number, mediaIdx: number): number {
        let offset = 0
        for (let i = 0; i < groupIdx; i++) {
            offset += filteredGroups[i].media.length
        }
        return offset + mediaIdx
    }

    // Links that have any media (for the filter dropdown)
    const linksForFilter = allGroups.filter(g => g.media.length > 0)

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        All Media
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md border border-zinc-800">
                            <Button
                                variant={typeFilter === 'all' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 rounded-r-none text-xs px-2.5"
                                onClick={() => setTypeFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={typeFilter === 'image' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 rounded-none border-x border-zinc-800 text-xs px-2.5"
                                onClick={() => setTypeFilter('image')}
                            >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Images
                            </Button>
                            <Button
                                variant={typeFilter === 'video' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="h-7 rounded-l-none text-xs px-2.5"
                                onClick={() => setTypeFilter('video')}
                            >
                                <Video className="h-3 w-3 mr-1" />
                                Videos
                            </Button>
                        </div>
                        <Select value={linkFilter || 'all'} onValueChange={(v) => setLinkFilter(v === 'all' ? null : v)}>
                            <SelectTrigger className="w-[160px] h-7 text-xs">
                                <SelectValue placeholder="All links" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All links</SelectItem>
                                {linksForFilter.map(g => (
                                    <SelectItem key={g.linkId} value={g.linkId}>
                                        {g.purpose || formatDate(g.date)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-y-auto max-h-[450px] space-y-4 pr-1">
                        {filteredGroups.map((group, groupIdx) => (
                            <div key={group.linkId}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-sm font-medium truncate">
                                        {group.purpose || 'Untitled'}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] shrink-0 px-1.5 py-0">
                                        {formatDate(group.date)}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] shrink-0 px-1.5 py-0">
                                        {group.media.length}
                                    </Badge>
                                </div>
                                <div className="flex gap-1.5 overflow-x-auto pb-2">
                                    {group.media.map((item, mediaIdx) => (
                                        <div
                                            key={`${item.source}-${item.id}`}
                                            className="relative group shrink-0 w-36 h-36 rounded-lg overflow-hidden border border-zinc-800 cursor-pointer"
                                            onClick={() => setLightboxIndex(getGlobalIndex(groupIdx, mediaIdx))}
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
                                                        <div className="bg-black/60 rounded-full p-1">
                                                            <Play className="h-3.5 w-3.5 text-white fill-white" />
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
                                        </div>
                                    ))}
                                    {plinkLoading && linksWithMedia.find(l => l.id === group.linkId)?.plink_link_id && group.media.filter(m => m.source === 'plink').length === 0 && (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={`skel-${i}`} className="shrink-0 w-36 h-36 rounded-lg" />
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                        {!plinkLoading && filteredGroups.length === 0 && (
                            <p className="text-sm text-muted-foreground py-4 text-center">No media found.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {lightboxIndex !== null && (
                <Lightbox
                    media={lightboxMedia}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                    onMediaError={() => {
                        setLightboxIndex(null)
                        for (const link of plinkLinks) {
                            plinkMediaCache.delete(link.plink_link_id!)
                        }
                        fetchPlinkMedia(false)
                    }}
                />
            )}
        </>
    )
}
