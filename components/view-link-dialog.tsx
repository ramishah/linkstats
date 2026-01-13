"use client"

import { Star, MapPin, Clock, Users } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Map as MapComponent, MapMarker, MarkerContent, MapControls } from "@/components/ui/map"
import { formatAddress } from "@/lib/utils"

interface ViewLinkDialogProps {
    link: any
    significantLocations?: any[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${
                        star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-zinc-600"
                    }`}
                />
            ))}
        </div>
    )
}

export function ViewLinkDialog({ link, significantLocations = [], open, onOpenChange }: ViewLinkDialogProps) {
    const attendees = link?.link_members?.filter((m: any) => !m.is_flop).map((m: any) => m.profiles?.name) || []
    const floppers = link?.link_members?.filter((m: any) => m.is_flop).map((m: any) => m.profiles?.name) || []
    const locations = link?.link_locations || []
    const reviews = link?.link_reviews || []

    const hours = Math.floor((link?.duration_minutes || 0) / 60)
    const minutes = (link?.duration_minutes || 0) % 60

    // Calculate center for map
    const hasLocations = locations.length > 0
    const centerLat = hasLocations
        ? locations.reduce((sum: number, loc: any) => sum + loc.location_lat, 0) / locations.length
        : 0
    const centerLng = hasLocations
        ? locations.reduce((sum: number, loc: any) => sum + loc.location_lng, 0) / locations.length
        : 0

    // Calculate average rating
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null

    if (!link) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="text-xl">{link.purpose}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                            {new Date(link.date).toLocaleDateString()}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Map */}
                    {hasLocations && (
                        <div className="h-[200px] rounded-lg overflow-hidden border border-zinc-800">
                            <MapComponent
                                center={[centerLng, centerLat]}
                                zoom={13}
                                styles={{
                                    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                                    light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                                }}
                            >
                                <MapControls position="bottom-right" showZoom={true} />
                                {locations.map((loc: any, i: number) => (
                                    <MapMarker
                                        key={i}
                                        longitude={loc.location_lng}
                                        latitude={loc.location_lat}
                                    >
                                        <MarkerContent>
                                            <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                                        </MarkerContent>
                                    </MapMarker>
                                ))}
                            </MapComponent>
                        </div>
                    )}

                    {/* Details */}
                    <div className="space-y-3">
                        {/* Duration */}
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{hours}h {minutes}m</span>
                        </div>

                        {/* Locations */}
                        {locations.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                    {locations.map((loc: any, i: number) => {
                                        const sigLoc = significantLocations?.find(
                                            (sl: any) => sl.address === loc.location_name
                                        )
                                        return sigLoc ? (
                                            <Badge key={i} variant="outline" className="font-normal">
                                                {sigLoc.label}
                                            </Badge>
                                        ) : (
                                            <span key={i}>
                                                {formatAddress(loc.location_name)}
                                                {i < locations.length - 1 && ", "}
                                            </span>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Attendees */}
                        {attendees.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex flex-wrap gap-1">
                                    {attendees.map((name: string, i: number) => (
                                        <Badge key={i} variant="secondary" className="font-normal">
                                            {name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Floppers */}
                        {floppers.length > 0 && (
                            <div className="flex items-start gap-2 text-sm">
                                <span className="text-xs text-muted-foreground">Flops:</span>
                                <div className="flex flex-wrap gap-1">
                                    {floppers.map((name: string, i: number) => (
                                        <Badge key={i} variant="destructive" className="font-normal">
                                            {name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reviews Section */}
                    <div className="border-t border-zinc-800 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">
                                Reviews ({reviews.length})
                            </h3>
                            {avgRating && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span>{avgRating} average</span>
                                </div>
                            )}
                        </div>

                        {reviews.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No reviews yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {reviews.map((review: any) => (
                                    <div
                                        key={review.id}
                                        className="bg-zinc-900/50 rounded-lg p-3 space-y-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <StarRating rating={review.rating} />
                                                <span className="text-sm font-medium">
                                                    {review.profiles?.name || "Anonymous"}
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-muted-foreground">
                                                &quot;{review.comment}&quot;
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
