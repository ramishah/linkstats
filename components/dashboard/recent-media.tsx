"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { ImageIcon, Play, Video, ChevronLeft, ChevronRight } from "lucide-react"
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
const LINKS_PER_PAGE = 5

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
    const [currentPage, setCurrentPage] = useState(0)
    const fetchingRef = useRef(false)

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(0)
    }, [typeFilter, linkFilter])

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
            // Keep groups that have media OR have a plink connection (media may still be loading)
            groups = groups.filter(g => {
                if (g.media.length > 0) return true
                const link = linksWithMedia.find(l => l.id === g.linkId)
                return !!link?.plink_link_id
            })
        }

        return groups
    }, [allGroups, typeFilter, linkFilter, plinkLoading, linksWithMedia])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / LINKS_PER_PAGE))

    const paginatedGroups = useMemo(() => {
        if (linkFilter) return filteredGroups
        const start = currentPage * LINKS_PER_PAGE
        return filteredGroups.slice(start, start + LINKS_PER_PAGE)
    }, [filteredGroups, currentPage, linkFilter])

    const showPagination = !linkFilter && totalPages > 1

    // Plink link IDs on the current page — stable string key to avoid effect loops
    const currentPagePlinkIds = useMemo(() => {
        const ids = paginatedGroups
            .map(g => linksWithMedia.find(l => l.id === g.linkId))
            .filter((l): l is LinkWithMedia => !!l?.plink_link_id)
            .map(l => l.plink_link_id!)
        return ids
    }, [paginatedGroups, linksWithMedia])

    const plinkIdsKey = currentPagePlinkIds.join(',')

    const fetchPlinkMedia = useCallback(async (links: LinkWithMedia[], showLoading: boolean) => {
        if (links.length === 0 || fetchingRef.current) return
        fetchingRef.current = true
        if (showLoading) setPlinkLoading(true)

        const now = Date.now()
        const toFetch: LinkWithMedia[] = []
        const fromCache: Record<string, UnifiedMediaItem[]> = {}

        for (const link of links) {
            const cached = plinkMediaCache.get(link.plink_link_id!)
            if (cached && now - cached.fetchedAt < PLINK_CACHE_TTL) {
                fromCache[link.id] = normalizePlinkMedia(cached.data, link.id)
            } else {
                toFetch.push(link)
            }
        }

        if (toFetch.length === 0) {
            setPlinkLoading(false)
            fetchingRef.current = false
            return
        }

        const results = await Promise.allSettled(
            toFetch.map(async (link) => {
                const res = await fetch(`/api/plink/media/${link.plink_link_id}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    plinkMediaCache.set(link.plink_link_id!, { data, fetchedAt: Date.now() })
                    return { linkId: link.id, data }
                }
                return { linkId: link.id, data: [] }
            })
        )

        const fetched: Record<string, UnifiedMediaItem[]> = { ...fromCache }
        for (const result of results) {
            if (result.status === 'fulfilled') {
                fetched[result.value.linkId] = normalizePlinkMedia(result.value.data, result.value.linkId)
            }
        }

        setPlinkMediaByLink(prev => ({ ...prev, ...fetched }))
        setPlinkLoading(false)
        fetchingRef.current = false
    }, [])

    // Fetch plink media when current page's plink links change
    useEffect(() => {
        if (!plinkIdsKey) return
        const links = linksWithMedia.filter(l => l.plink_link_id && currentPagePlinkIds.includes(l.plink_link_id))
        if (links.length === 0) return

        const now = Date.now()
        const hasUncached = links.some(l => {
            const cached = plinkMediaCache.get(l.plink_link_id!)
            return !cached || now - cached.fetchedAt >= PLINK_CACHE_TTL
        })
        if (hasUncached) {
            setPlinkLoading(true)
            fetchPlinkMedia(links, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plinkIdsKey])

    // Keep a ref to current page plink links for use in callbacks without causing re-renders
    const currentPagePlinkLinksRef = useRef<LinkWithMedia[]>([])
    currentPagePlinkLinksRef.current = useMemo(
        () => linksWithMedia.filter(l => l.plink_link_id && currentPagePlinkIds.includes(l.plink_link_id)),
        [linksWithMedia, currentPagePlinkIds]
    )

    // Auto-refresh before presigned URLs expire (only current page)
    useEffect(() => {
        if (!plinkIdsKey) return
        const interval = setInterval(() => {
            const links = currentPagePlinkLinksRef.current
            for (const link of links) {
                plinkMediaCache.delete(link.plink_link_id!)
            }
            fetchPlinkMedia(links, false)
        }, PLINK_CACHE_TTL)
        return () => clearInterval(interval)
    }, [plinkIdsKey, fetchPlinkMedia])

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const links = currentPagePlinkLinksRef.current
        for (const link of links) {
            plinkMediaCache.delete(link.plink_link_id!)
        }
        fetchPlinkMedia(links, false)
    }, [fetchPlinkMedia])

    // Flat media array for lightbox (from paginated groups only)
    const allVisibleMedia = useMemo(
        () => paginatedGroups.flatMap(g => g.media),
        [paginatedGroups]
    )

    const lightboxMedia: LightboxMedia[] = useMemo(
        () => allVisibleMedia.map(item => ({ url: item.fullUrl, type: item.type })),
        [allVisibleMedia]
    )

    // Compute global lightbox index for a media item
    function getGlobalIndex(groupIdx: number, mediaIdx: number): number {
        let offset = 0
        for (let i = 0; i < groupIdx; i++) {
            offset += paginatedGroups[i].media.length
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
                        {paginatedGroups.map((group, groupIdx) => (
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
                        {!plinkLoading && paginatedGroups.length === 0 && (
                            <p className="text-sm text-muted-foreground py-4 text-center">No media found.</p>
                        )}
                    </div>
                    {showPagination && (
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-3">
                            <span className="text-xs text-muted-foreground">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    disabled={currentPage === 0}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    disabled={currentPage >= totalPages - 1}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
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
                    onMediaError={() => {
                        const links = currentPagePlinkLinksRef.current
                        for (const link of links) {
                            plinkMediaCache.delete(link.plink_link_id!)
                        }
                        fetchPlinkMedia(links, false)
                    }}
                />
            )}
        </>
    )
}
