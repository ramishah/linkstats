"use client"

import { useState, useRef, useEffect } from "react"
import { Star, MapPin, Clock, Users, Plus, X, ImageIcon, Pencil, Play, Loader2 } from "lucide-react"
import { Lightbox } from "@/components/ui/lightbox"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Map as MapComponent, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip, MapControls } from "@/components/ui/map"
import { formatAddress } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { saveLinkImage, deleteLinkImage, createSignificantLocation, updateSignificantLocation, createLinkReview, deleteLinkReview } from "@/lib/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Client-side cache for plink media (avoids re-fetching on every dialog open)
const plinkMediaCache = new Map<string, { data: any[]; fetchedAt: number }>()
const PLINK_CACHE_TTL = 10 * 60 * 1000 // 10 minutes (presigned URLs expire after ~15min)

interface ViewLinkDialogProps {
    link: any
    friends?: any[]
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

function InteractiveStarRating({ rating, onRatingChange }: { rating: number, onRatingChange: (rating: number) => void }) {
    const [hoverRating, setHoverRating] = useState(0)

    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className="p-0.5 hover:scale-110 transition-transform"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => onRatingChange(star)}
                >
                    <Star
                        className={`h-6 w-6 ${
                            star <= (hoverRating || rating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-zinc-600"
                        }`}
                    />
                </button>
            ))}
        </div>
    )
}

export function ViewLinkDialog({ link, friends = [], significantLocations = [], open, onOpenChange }: ViewLinkDialogProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [images, setImages] = useState<any[]>([])
    const [editingLocation, setEditingLocation] = useState<string | null>(null)
    const [labelInput, setLabelInput] = useState("")
    const [localSignificantLocations, setLocalSignificantLocations] = useState<any[]>(significantLocations)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Review functionality state
    const [reviews, setReviews] = useState<any[]>([])
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [reviewRating, setReviewRating] = useState(0)
    const [reviewComment, setReviewComment] = useState("")
    const [reviewProfileId, setReviewProfileId] = useState("")
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)

    // Plink media state
    const [plinkMedia, setPlinkMedia] = useState<any[]>([])
    const [plinkLoading, setPlinkLoading] = useState(false)

    // Fetch plink media when dialog opens and link has plink_link_id (with caching)
    useEffect(() => {
        if (!open || !link?.plink_link_id) {
            setPlinkMedia([])
            return
        }

        const cached = plinkMediaCache.get(link.plink_link_id)
        if (cached && Date.now() - cached.fetchedAt < PLINK_CACHE_TTL) {
            setPlinkMedia(cached.data)
            return
        }

        setPlinkLoading(true)
        fetch(`/api/plink/media/${link.plink_link_id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    plinkMediaCache.set(link.plink_link_id, { data, fetchedAt: Date.now() })
                    setPlinkMedia(data)
                }
            })
            .catch(err => console.error('Failed to fetch plink media:', err))
            .finally(() => setPlinkLoading(false))
    }, [open, link?.plink_link_id])

    // Sync images when link changes or dialog opens
    useEffect(() => {
        if (link?.link_images) {
            setImages(link.link_images)
        }
    }, [link?.id, link?.link_images])

    // Sync reviews when link changes or dialog opens
    useEffect(() => {
        if (link?.link_reviews) {
            setReviews(link.link_reviews)
        }
    }, [link?.id, link?.link_reviews])

    // Reset lightbox and review form when dialog closes
    useEffect(() => {
        if (!open) {
            setLightboxIndex(null)
            setShowReviewForm(false)
            setReviewRating(0)
            setReviewComment("")
            setReviewProfileId("")
        }
    }, [open])

    // Sync significant locations when prop changes
    useEffect(() => {
        setLocalSignificantLocations(significantLocations)
    }, [significantLocations])

    const handleSaveLocationLabel = async (address: string, label: string) => {
        const existingSigLoc = localSignificantLocations.find(sl => sl.address === address)

        try {
            if (existingSigLoc) {
                await updateSignificantLocation(address, label)
            } else {
                await createSignificantLocation(address, label)
            }

            // Update local state immediately
            if (existingSigLoc) {
                setLocalSignificantLocations(prev =>
                    prev.map(sl => sl.address === address ? { ...sl, label } : sl)
                )
            } else {
                setLocalSignificantLocations(prev => [...prev, { address, label }])
            }

            setEditingLocation(null)
            setLabelInput("")
        } catch (error) {
            console.error('Failed to save location label:', error)
        }
    }

    const attendees = link?.link_members?.filter((m: any) => !m.is_flop).map((m: any) => m.profiles?.name) || []
    const floppers = link?.link_members?.filter((m: any) => m.is_flop).map((m: any) => m.profiles?.name) || []
    const locations = link?.link_locations || []

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

    const getImageUrl = (storagePath: string) => {
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/link-images/${storagePath}`
    }

    // Build combined lightbox media array: local images first, then all plink media
    const allLightboxMedia: { url: string; type: 'image' | 'video' }[] = [
        ...images.map((img: any) => ({ url: getImageUrl(img.storage_path), type: 'image' as const })),
        ...plinkMedia.map((m: any) => ({
            url: m.url,
            type: (m.type === 'video' || m.mime?.startsWith('video/')) ? 'video' as const : 'image' as const,
        })),
    ]


    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !link) return

        setIsUploading(true)
        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${link.id}/${Date.now()}.${fileExt}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase
                .storage
                .from('link-images')
                .upload(fileName, file)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                return
            }

            // Save reference to database and get the real ID
            const result = await saveLinkImage(link.id, fileName, file.name)

            // Add to local state for immediate display with real database ID
            setImages(prev => [...prev, {
                id: result.id,
                storage_path: fileName,
                file_name: file.name
            }])
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDelete = async (imageId: string, storagePath: string) => {
        try {
            await deleteLinkImage(imageId, storagePath)
            setImages(prev => prev.filter(img => img.id !== imageId))
        } catch (error) {
            console.error('Delete failed:', error)
        }
    }

    const handleSubmitReview = async () => {
        if (!reviewProfileId || reviewRating === 0) return

        setIsSubmittingReview(true)
        try {
            const result = await createLinkReview(link.id, reviewProfileId, reviewRating, reviewComment || undefined)

            // Find the profile to display the name
            const profile = friends.find(f => f.id === reviewProfileId)

            // Add to local state for immediate display
            setReviews(prev => [...prev, {
                id: result.id,
                rating: reviewRating,
                comment: reviewComment || null,
                profile_id: reviewProfileId,
                profiles: profile ? { name: profile.name } : null,
                created_at: new Date().toISOString()
            }])

            // Reset form and show toast
            setShowReviewForm(false)
            setReviewRating(0)
            setReviewComment("")
            setReviewProfileId("")
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)
        } catch (error) {
            console.error('Failed to submit review:', error)
        } finally {
            setIsSubmittingReview(false)
        }
    }

    const handleDeleteReview = async (reviewId: string) => {
        try {
            await deleteLinkReview(reviewId)
            setReviews(prev => prev.filter(r => r.id !== reviewId))
        } catch (error) {
            console.error('Failed to delete review:', error)
        }
    }

    if (!link) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-3xl border-zinc-800 bg-zinc-950 max-h-[90vh] overflow-y-auto"
                    onInteractOutside={(e) => {
                        if (lightboxIndex !== null) e.preventDefault()
                    }}
                    onEscapeKeyDown={(e) => {
                        if (lightboxIndex !== null) e.preventDefault()
                    }}
                >
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
                            <div className="h-[250px] rounded-lg overflow-hidden outline-none [&_canvas]:outline-none">
                                <MapComponent
                                    center={[centerLng, centerLat]}
                                    zoom={13}
                                    styles={{
                                        dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                                        light: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                                    }}
                                >
                                    <MapControls position="bottom-right" showZoom={true} />
                                    {locations.map((loc: any, i: number) => {
                                        const label = loc.location_label
                                            || localSignificantLocations?.find((sl: any) => sl.address === loc.location_name)?.label
                                        return (
                                            <MapMarker
                                                key={i}
                                                longitude={loc.location_lng}
                                                latitude={loc.location_lat}
                                            >
                                                <MarkerContent>
                                                    <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                                                </MarkerContent>
                                                <MarkerTooltip>
                                                    {label ? (
                                                        <Badge variant="outline" className="bg-background text-foreground border-foreground/20">
                                                            {label}
                                                        </Badge>
                                                    ) : (
                                                        formatAddress(loc.location_name)
                                                    )}
                                                </MarkerTooltip>
                                                <MarkerPopup>
                                                    <div className="space-y-1 max-w-[250px]">
                                                        {label ? (
                                                            <Badge variant="outline" className="bg-background text-foreground border-foreground/20">
                                                                {label}
                                                            </Badge>
                                                        ) : null}
                                                        <p className="text-xs text-muted-foreground break-words">
                                                            {formatAddress(loc.location_name)}
                                                        </p>
                                                    </div>
                                                </MarkerPopup>
                                            </MapMarker>
                                        )
                                    })}
                                </MapComponent>
                            </div>
                        )}

                        {/* Photos Section */}
                        <div className="border-t border-zinc-800 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Photos ({images.length + plinkMedia.length})
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleUpload}
                                />
                            </div>

                            {images.length === 0 && plinkMedia.length === 0 && !plinkLoading ? (
                                <p className="text-sm text-muted-foreground">No photos yet.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map((image: any, idx: number) => (
                                        <div
                                            key={image.id}
                                            className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-800 cursor-pointer"
                                            onClick={() => setLightboxIndex(idx)}
                                        >
                                            <img
                                                src={getImageUrl(image.storage_path)}
                                                alt={image.file_name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            <button
                                                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDelete(image.id, image.storage_path)
                                                }}
                                            >
                                                <X className="h-4 w-4 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    {plinkMedia.map((media: any, idx: number) => {
                                        const isVideo = media.type === 'video' || media.mime?.startsWith('video/')
                                        const thumb = media.thumbnailUrl || media.url
                                        const lightboxIdx = images.length + idx

                                        return (
                                            <div
                                                key={`plink-${media.id}`}
                                                className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-800 cursor-pointer"
                                                onClick={() => setLightboxIndex(lightboxIdx)}
                                            >
                                                {isVideo ? (
                                                    <>
                                                        {thumb ? (
                                                            <img
                                                                src={thumb}
                                                                alt="Video"
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                                <Play className="h-8 w-8 text-zinc-500" />
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="bg-black/60 rounded-full p-2">
                                                                <Play className="h-6 w-6 text-white fill-white" />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img
                                                        src={media.url}
                                                        alt="Plink photo"
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                )}
                                                <span className="absolute bottom-1 left-1 text-xs font-medium bg-black/70 text-zinc-200 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    plink
                                                </span>
                                            </div>
                                        )
                                    })}
                                    {plinkLoading && (
                                        <div className="aspect-square rounded-lg border border-zinc-800 flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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
                                            const sigLoc = localSignificantLocations?.find(
                                                (sl: any) => sl.address === loc.location_name
                                            )
                                            const displayLabel = loc.location_label || sigLoc?.label
                                            return (
                                                <Popover
                                                    key={i}
                                                    open={editingLocation === loc.location_name}
                                                    onOpenChange={(isOpen) => {
                                                        if (isOpen) {
                                                            setEditingLocation(loc.location_name)
                                                            setLabelInput(sigLoc?.label || "")
                                                        } else {
                                                            setEditingLocation(null)
                                                            setLabelInput("")
                                                        }
                                                    }}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <button className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity">
                                                            {sigLoc ? (
                                                                <Badge variant="outline" className="font-normal cursor-pointer">
                                                                    {displayLabel}
                                                                    <Pencil className="h-3 w-3 ml-1 opacity-50" />
                                                                </Badge>
                                                            ) : displayLabel ? (
                                                                <Badge variant="secondary" className="font-normal cursor-pointer">
                                                                    {displayLabel}
                                                                    <Plus className="h-3 w-3 ml-1 opacity-50" />
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="font-normal cursor-pointer">
                                                                    {formatAddress(loc.location_name)}
                                                                    <Plus className="h-3 w-3 ml-1 opacity-50" />
                                                                </Badge>
                                                            )}
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-64 p-3" align="start">
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-muted-foreground">
                                                                {sigLoc ? "Edit label" : "Add a name for this location"}
                                                            </p>
                                                            <Input
                                                                placeholder="e.g. Home, Work, Coffee Shop"
                                                                value={labelInput}
                                                                onChange={(e) => setLabelInput(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" && labelInput.trim()) {
                                                                        handleSaveLocationLabel(loc.location_name, labelInput.trim())
                                                                    }
                                                                }}
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setEditingLocation(null)
                                                                        setLabelInput("")
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        if (labelInput.trim()) {
                                                                            handleSaveLocationLabel(loc.location_name, labelInput.trim())
                                                                        }
                                                                    }}
                                                                    disabled={!labelInput.trim()}
                                                                >
                                                                    Save
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
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
                                <div className="flex items-center gap-3">
                                    {avgRating && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span>{avgRating} average</span>
                                        </div>
                                    )}
                                    <Button
                                        size="sm"
                                        className="bg-white text-black hover:bg-zinc-200"
                                        onClick={() => setShowReviewForm(true)}
                                        disabled={showReviewForm}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Add Review
                                    </Button>
                                </div>
                            </div>

                            {/* Inline Review Form */}
                            {showReviewForm && (
                                <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Rating</label>
                                        <InteractiveStarRating
                                            rating={reviewRating}
                                            onRatingChange={setReviewRating}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Reviewer</label>
                                        <Select value={reviewProfileId} onValueChange={setReviewProfileId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select person" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {friends.map((friend) => (
                                                    <SelectItem key={friend.id} value={friend.id}>
                                                        {friend.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Comment (optional)</label>
                                        <Textarea
                                            placeholder="Write a comment..."
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowReviewForm(false)
                                                setReviewRating(0)
                                                setReviewComment("")
                                                setReviewProfileId("")
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleSubmitReview}
                                            disabled={!reviewProfileId || reviewRating === 0 || isSubmittingReview}
                                        >
                                            {isSubmittingReview ? "Submitting..." : "Submit Review"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {reviews.length === 0 && !showReviewForm ? (
                                <p className="text-sm text-muted-foreground">No reviews yet.</p>
                            ) : reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {reviews.map((review: any) => (
                                        <div
                                            key={review.id}
                                            className="bg-zinc-900/50 rounded-lg p-3 space-y-2 group relative"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <StarRating rating={review.rating} />
                                                    <span className="text-sm font-medium">
                                                        {review.profiles?.name || "Anonymous"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        className="p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeleteReview(review.id)}
                                                    >
                                                        <X className="h-3 w-3 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-muted-foreground">
                                                    &quot;{review.comment}&quot;
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Toast notification */}
            {showToast && (
                <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
                    <Alert className="bg-zinc-900 border-zinc-700">
                        <AlertDescription>Review submitted successfully!</AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Image/Video Lightbox */}
            {lightboxIndex !== null && (
                <Lightbox
                    media={allLightboxMedia}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </>
    )
}
