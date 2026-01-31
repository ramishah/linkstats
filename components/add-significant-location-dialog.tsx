'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createSignificantLocation, updateSignificantLocation, deleteSignificantLocation } from '@/lib/actions'
import { Plus, Check, AlertCircle, Trash2, Pencil } from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface LinkLocation {
    location_name: string
    location_lat: number
    location_lng: number
}

interface ManageSignificantLocationsDialogProps {
    distinctLocations: string[]
    significantLocations: any[]
    linkLocations?: LinkLocation[]
}

export function ManageSignificantLocationsDialog({ distinctLocations, significantLocations, linkLocations = [] }: ManageSignificantLocationsDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState('')
    const [label, setLabel] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    // Derived state
    const existingLoction = significantLocations.find(l => l.address === selectedAddress)
    const isEditMode = !!existingLoction

    useEffect(() => {
        if (existingLoction) {
            setLabel(existingLoction.label)
        } else {
            setLabel('')
        }
    }, [selectedAddress, existingLoction])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFeedback(null)

        if (!selectedAddress || !label) {
            setFeedback({ type: 'error', message: "Please select a location and define a name." })
            return
        }

        // Look up coordinates from link_locations
        const matchingLocation = linkLocations.find(loc => loc.location_name === selectedAddress)
        const lat = matchingLocation?.location_lat
        const lng = matchingLocation?.location_lng

        setIsSubmitting(true)
        try {
            if (isEditMode) {
                await updateSignificantLocation(selectedAddress, label, lat, lng)
                setFeedback({
                    type: 'success',
                    message: `Updated location to "${label}"`
                })
            } else {
                await createSignificantLocation(selectedAddress, label, lat, lng)
                setFeedback({
                    type: 'success',
                    message: `Added "${label}" for ${formatAddress(selectedAddress)}`
                })
            }

            setTimeout(() => setFeedback(null), 3000)
        } catch (error) {
            setFeedback({ type: 'error', message: "Operation failed." })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this significant location?")) return

        setIsSubmitting(true)
        try {
            await deleteSignificantLocation(selectedAddress)
            setFeedback({
                type: 'success',
                message: "Location deleted successfully."
            })
            setLabel('')

            setTimeout(() => setFeedback(null), 3000)
        } catch (error) {
            setFeedback({ type: 'error', message: "Failed to delete location." })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground border-input">
                        <Pencil className="mr-2 h-4 w-4" /> Add/Edit Significant Location
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Significant Location' : 'Add Significant Location'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode
                                ? 'Update the name or delete this saved location.'
                                : 'Give a friendly name to a frequently used address.'}
                        </DialogDescription>
                    </DialogHeader>
                    {feedback?.type === 'error' && (
                        <div className="text-sm text-destructive font-medium flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> {feedback.message}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="address">Select Address</Label>
                            <Select value={selectedAddress} onValueChange={setSelectedAddress}>
                                <SelectTrigger className="w-full truncate">
                                    <SelectValue placeholder="Select an address to manage" />
                                </SelectTrigger>
                                <SelectContent className="max-w-[300px] sm:max-w-[380px]">
                                    {distinctLocations.map((loc) => {
                                        const isSaved = significantLocations.some(l => l.address === loc)
                                        return (
                                            <SelectItem key={loc} value={loc}>
                                                <span className="flex items-center gap-2 w-full truncate max-w-[280px] sm:max-w-[350px]">
                                                    {isSaved && <Check className="h-3 w-3 text-green-500 shrink-0" />}
                                                    <span className="truncate">{formatAddress(loc)}</span>
                                                </span>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Location Name</Label>
                            <Input
                                id="name"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Rami's House"
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            {isEditMode && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            )}
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Location' : 'Save Location')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {feedback?.type === 'success' && (
                <div className="fixed bottom-4 right-4 z-50 w-full max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Alert className="bg-zinc-950 border-zinc-800 text-white text-left">
                        <Check className="h-4 w-4 text-green-500" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>
                            {feedback.message}
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </>
    )
}
