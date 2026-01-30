"use client"

import { useState } from "react"
import { Plus, Check, ChevronDownIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createStandaloneFlop } from "@/lib/actions"

interface AddFlopDialogProps {
    friends: any[]
}

export function AddFlopDialog({ friends }: AddFlopDialogProps) {
    const [open, setOpen] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [profileId, setProfileId] = useState("")
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [reason, setReason] = useState("")
    const [isLinkEnder, setIsLinkEnder] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!profileId || !date) {
            return
        }

        setIsSubmitting(true)
        try {
            await createStandaloneFlop(profileId, date.toISOString(), reason || undefined, isLinkEnder)
            setOpen(false)
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)
            // Reset form
            setProfileId("")
            setDate(new Date())
            setReason("")
            setIsLinkEnder(false)
        } catch (error) {
            console.error("Failed to create flop:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Add standalone flop">
                        <Plus className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] border-zinc-800 bg-zinc-950">
                    <DialogHeader>
                        <DialogTitle>Record a Flop</DialogTitle>
                        <DialogDescription>
                            Record a standalone flop (not attached to a specific link)
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        {/* Who flopped */}
                        <div className="space-y-2">
                            <Label>Who flopped?</Label>
                            <Select value={profileId} onValueChange={setProfileId}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-700">
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

                        {/* Date picker */}
                        <div className="space-y-2">
                            <Label>When did they flop?</Label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between font-normal bg-zinc-900 border-zinc-700"
                                    >
                                        {date ? format(date, "PPP") : "Select date"}
                                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        captionLayout="dropdown"
                                        fromYear={2022}
                                        toYear={2030}
                                        onSelect={(selectedDate) => {
                                            setDate(selectedDate)
                                            setIsCalendarOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Input
                                id="reason"
                                placeholder="Why did they flop?"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="bg-zinc-900 border-zinc-700"
                            />
                        </div>

                        {/* Link Ender checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="link-ender"
                                checked={isLinkEnder}
                                onCheckedChange={(checked) => setIsLinkEnder(checked === true)}
                            />
                            <Label htmlFor="link-ender" className="text-sm font-normal cursor-pointer">
                                This was a Link Ender (prevented a link from happening)
                            </Label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!profileId || !date || isSubmitting}
                        >
                            {isSubmitting ? "Recording..." : "Record Flop"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {showToast && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Alert className="bg-zinc-950 border-zinc-800 text-white text-left">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertTitle>Flop Recorded</AlertTitle>
                        <AlertDescription>
                            The flop has been added to the wall of shame.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
