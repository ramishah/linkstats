'use client'

import { useState, useEffect, useRef } from 'react'
import { createLink, updateLink } from '@/lib/actions'
import { searchLocations, type GeocodingResult } from '@/lib/geocoding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ChevronDownIcon, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface LinkFormProps {
    friends: any[]
    initialData?: any
    isEdit?: boolean
    onSuccess?: () => void
}

export function LinkForm({ friends, initialData, isEdit = false, onSuccess }: LinkFormProps) {
    // Parse initial members if editing
    const initialAttendees = new Set<string>(
        initialData?.link_members
            ?.filter((m: any) => !m.is_flop)
            .map((m: any) => m.profile_id as string) || []
    )
    const initialFloppers = new Set<string>(
        initialData?.link_members
            ?.filter((m: any) => m.is_flop)
            .map((m: any) => m.profile_id as string) || []
    )

    // Date & Time State
    const [date, setDate] = useState<Date | undefined>(
        initialData?.date ? new Date(initialData.date) : new Date()
    )

    // Extract HH:mm from initial date or default to current time
    const defaultTime = initialData?.date
        ? format(new Date(initialData.date), 'HH:mm')
        : format(new Date(), 'HH:mm')

    const [time, setTime] = useState(defaultTime)

    // Combine date and time for the hidden input
    const [combinedDateTime, setCombinedDateTime] = useState('')

    useEffect(() => {
        if (date && time) {
            const [hours, minutes] = time.split(':').map(Number)
            const newDate = new Date(date)
            newDate.setHours(hours)
            newDate.setMinutes(minutes)
            setCombinedDateTime(newDate.toISOString())
        }
    }, [date, time])


    const initialDuration = initialData?.duration_minutes || 60
    const initialHours = Math.floor(initialDuration / 60).toString()
    const initialMinutes = (initialDuration % 60).toString()

    const [hours, setHours] = useState(initialHours)
    const [minutes, setMinutes] = useState(initialMinutes)

    const [selectedFloppers, setSelectedFloppers] = useState<Set<string>>(initialFloppers)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    // Location autocomplete state
    const [locationInput, setLocationInput] = useState(initialData?.location_name || '')
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
        initialData?.location_lat && initialData?.location_lng
            ? { lat: initialData.location_lat, lng: initialData.location_lng }
            : null
    )
    const [suggestions, setSuggestions] = useState<GeocodingResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Debounced search effect
    useEffect(() => {
        if (!locationInput.trim() || locationInput.length < 3 || coordinates) {
            setSuggestions([])
            return
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true)
            const results = await searchLocations(locationInput)
            setSuggestions(results)
            setShowDropdown(results.length > 0)
            setIsSearching(false)
        }, 400) // 400ms debounce

        return () => clearTimeout(debounceTimer)
    }, [locationInput, coordinates])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectLocation = (result: GeocodingResult) => {
        setLocationInput(result.display_name)
        setCoordinates({ lat: result.lat, lng: result.lng })
        setSuggestions([])
        setShowDropdown(false)
    }

    const handleLocationInputChange = (value: string) => {
        setLocationInput(value)
        setCoordinates(null) // Clear coordinates when user types
    }

    const handleFlopperChange = (id: string, checked: boolean) => {
        const next = new Set(selectedFloppers)
        if (checked) {
            next.add(id)
        } else {
            next.delete(id)
        }
        setSelectedFloppers(next)
    }

    // Helper to get initial reason
    const getInitialReason = (id: string) => {
        const member = initialData?.link_members?.find((m: any) => m.profile_id === id && m.is_flop)
        return member?.flop_reason || ''
    }

    const action = isEdit ? updateLink.bind(null, initialData.id) : createLink

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Link' : 'Log a New Link'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={async (formData) => {
                    await action(formData)
                    if (onSuccess) {
                        onSuccess()
                    }
                }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="date-picker" className="px-1">
                                Date
                            </Label>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        id="date-picker"
                                        className="w-full justify-between font-normal bg-zinc-900 border-zinc-700"
                                    >
                                        {date ? date.toLocaleDateString() : "Select date"}
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
                                        onSelect={(date) => {
                                            setDate(date)
                                            setIsCalendarOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Label htmlFor="time-picker" className="px-1">
                                Time
                            </Label>
                            <Input
                                type="time"
                                id="time-picker"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Duration</Label>
                        <div className="flex gap-4">
                            <div className="min-w-[100px]">
                                <Select value={hours} onValueChange={setHours}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Hours" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 13 }).map((_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                                {i} {i === 1 ? 'hr' : 'hrs'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="min-w-[100px]">
                                <Select value={minutes} onValueChange={setMinutes}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Minutes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0, 15, 30, 45].map((m) => (
                                            <SelectItem key={m} value={m.toString()}>
                                                {m} mins
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <input
                            type="hidden"
                            name="duration"
                            value={(parseInt(hours) * 60 + parseInt(minutes)).toString()}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose / Activity</Label>
                        <Input
                            id="purpose"
                            name="purpose"
                            placeholder="e.g. Coffee, Coding, Movie"
                            defaultValue={initialData?.purpose || ''}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    id="location"
                                    name="location"
                                    placeholder="Start typing an address..."
                                    value={locationInput}
                                    onChange={(e) => handleLocationInputChange(e.target.value)}
                                    onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                                    autoComplete="off"
                                    className={cn(
                                        "pr-10",
                                        coordinates && "border-green-600"
                                    )}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isSearching ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : coordinates ? (
                                        <MapPin className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {showDropdown && suggestions.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto"
                                >
                                    {suggestions.map((result, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none border-b border-zinc-800 last:border-b-0"
                                            onClick={() => handleSelectLocation(result)}
                                        >
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                                                <span className="line-clamp-2">{result.display_name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {coordinates && (
                            <p className="text-xs text-green-500">
                                Location selected ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
                            </p>
                        )}
                        <input type="hidden" name="latitude" value={coordinates?.lat || ''} />
                        <input type="hidden" name="longitude" value={coordinates?.lng || ''} />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-base">Attendees</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {friends.map((friend) => (
                                    <div key={`attendee-${friend.id}`} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`attendee-${friend.id}`}
                                            name="attendees"
                                            value={friend.id}
                                            defaultChecked={initialAttendees.has(friend.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-zinc-900 border-zinc-700"
                                        />
                                        <label htmlFor={`attendee-${friend.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {friend.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base text-red-400">Floppers</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {friends.map((friend) => {
                                    const isChecked = selectedFloppers.has(friend.id);
                                    return (
                                        <div key={`flopper-${friend.id}`} className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`flopper-${friend.id}`}
                                                    name="floppers"
                                                    value={friend.id}
                                                    checked={isChecked}
                                                    onChange={(e) => handleFlopperChange(friend.id, e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive bg-zinc-900 border-zinc-700"
                                                />
                                                <label htmlFor={`flopper-${friend.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {friend.name}
                                                </label>
                                            </div>
                                            {isChecked && (
                                                <Input
                                                    name={`flop_reason_${friend.id}`}
                                                    placeholder={`Why did ${friend.name} flop?`}
                                                    defaultValue={getInitialReason(friend.id)}
                                                    className="ml-6 w-[90%] h-8 text-xs bg-zinc-800/50"
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <input type="hidden" name="date" value={combinedDateTime} />
                    <Button type="submit" className="w-full">
                        {isEdit ? 'Update Link' : 'Save Link'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
