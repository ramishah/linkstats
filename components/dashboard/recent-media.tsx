"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbox, type LightboxMedia } from "@/components/ui/lightbox"

interface RecentMediaItem {
    id: string
    storage_path: string
    file_name: string
    created_at: string
    links: { id: string; purpose: string | null; date: string } | null
}

function getImageUrl(storagePath: string) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/link-images/${storagePath}`
}

export function RecentMedia({ media }: { media: RecentMediaItem[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    const lightboxMedia: LightboxMedia[] = media.map(item => ({
        url: getImageUrl(item.storage_path),
        type: 'image',
    }))

    if (media.length === 0) {
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
                        {media.map((item, idx) => (
                            <div
                                key={item.id}
                                className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-800 cursor-pointer"
                                onClick={() => setLightboxIndex(idx)}
                            >
                                <img
                                    src={getImageUrl(item.storage_path)}
                                    alt={item.file_name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                {item.links?.purpose && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <span className="text-xs text-white line-clamp-2">{item.links.purpose}</span>
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
