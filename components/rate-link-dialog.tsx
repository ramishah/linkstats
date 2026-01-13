"use client"

import { useState } from "react"
import { Star, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLinkReview } from "@/lib/actions"

interface RateLinkDialogProps {
    link: any
    friends: any[]
}

export function RateLinkDialog({ link, friends }: RateLinkDialogProps) {
    const [open, setOpen] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [comment, setComment] = useState("")
    const [profileId, setProfileId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0 || !profileId) {
            return
        }

        setIsSubmitting(true)
        try {
            await createLinkReview(link.id, profileId, rating, comment || undefined)
            setOpen(false)
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)
            // Reset form
            setRating(0)
            setComment("")
            setProfileId("")
        } catch (error) {
            console.error("Failed to submit review:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const displayRating = hoveredRating || rating

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Rate this link">
                        <Star className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] border-zinc-800 bg-zinc-950">
                    <DialogHeader>
                        <DialogTitle>Rate Link</DialogTitle>
                        <DialogDescription>
                            How was &quot;{link.purpose}&quot;?
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {/* Star Rating */}
                        <div className="space-y-2">
                            <Label>Rating</Label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 transition-transform hover:scale-110"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className={`h-8 w-8 transition-colors ${
                                                star <= displayRating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-zinc-600"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <Label htmlFor="comment">Comment (optional)</Label>
                            <Textarea
                                id="comment"
                                placeholder="Share your thoughts..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 resize-none"
                                rows={3}
                            />
                        </div>

                        {/* Who are you */}
                        <div className="space-y-2">
                            <Label>Who are you?</Label>
                            <Select value={profileId} onValueChange={setProfileId}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                                    <SelectValue placeholder="Select yourself" />
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

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={rating === 0 || !profileId || isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {showToast && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Alert className="bg-zinc-950 border-zinc-800 text-white text-left">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertTitle>Review Submitted</AlertTitle>
                        <AlertDescription>
                            Your review has been added.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
