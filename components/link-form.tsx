'use client'

import { useState, useEffect, useRef } from 'react'
import { createLink, updateLink } from '@/lib/actions'
import { searchMapbox, searchSignificantLocations } from '@/lib/geocoding'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ChevronDownIcon, MapPin, Loader2, X, Star } from "lucide-react"
import { Location, SignificantLocation, LocationSearchResult } from '@/lib/types'
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface LinkFormProps {
    friends: any[]
    initialData?: any
    isEdit?: boolean
    onSuccess?: () => void
    significantLocations?: SignificantLocation[]
}

export function LinkForm({ friends, initialData, isEdit = false, onSuccess, significantLocations = [] }: LinkFormProps) {
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

    // Multi-location state
    const [locations, setLocations] = useState<Location[]>(
        initialData?.link_locations?.map((loc: any) => ({
            location_name: loc.location_name,
            location_lat: loc.location_lat,
            location_lng: loc.location_lng
        })) || []
    )

    // Location search input state
    const [locationInput, setLocationInput] = useState('')
    const [savedResults, setSavedResults] = useState<LocationSearchResult[]>([])
    const [mapboxResults, setMapboxResults] = useState<LocationSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Search effect - handles both saved locations and Mapbox
    useEffect(() => {
        // Always filter saved locations (even on empty query for focus state)
        const filteredSaved = searchSignificantLocations(locationInput, significantLocations)
        setSavedResults(filteredSaved)

        // If no input, show saved locations only (for focus state)
        if (!locationInput.trim()) {
            setMapboxResults([])
            return
        }

        // Debounce Mapbox API calls
        if (locationInput.length < 2) {
            setMapboxResults([])
            return
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true)
            const results = await searchMapbox(locationInput)
            setMapboxResults(results)
            setIsSearching(false)
        }, 400)

        return () => clearTimeout(debounceTimer)
    }, [locationInput, significantLocations])

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

    const handleSelectLocation = (result: LocationSearchResult) => {
        // Add to locations array
        setLocations(prev => [...prev, {
            location_name: result.address,
            location_lat: result.lat,
            location_lng: result.lng
        }])
        // Clear input for next entry
        setLocationInput('')
        setSavedResults([])
        setMapboxResults([])
        setShowDropdown(false)
    }

    const handleRemoveLocation = (index: number) => {
        setLocations(prev => prev.filter((_, i) => i !== index))
    }

    const handleLocationInputChange = (value: string) => {
        setLocationInput(value)
        setShowDropdown(true)
    }

    const handleInputFocus = () => {
        // Show saved locations on focus
        const filteredSaved = searchSignificantLocations('', significantLocations)
        setSavedResults(filteredSaved)
        if (filteredSaved.length > 0 || locationInput.trim()) {
            setShowDropdown(true)
        }
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

    const hasResults = savedResults.length > 0 || mapboxResults.length > 0

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
                        <Label htmlFor="location">Locations</Label>

                        {/* List of added locations */}
                        {locations.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {locations.map((loc, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-zinc-800/50 rounded-md px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <MapPin className="h-4 w-4 text-green-500 shrink-0" />
                                            <span className="text-sm truncate">{loc.location_name}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            onClick={() => handleRemoveLocation(index)}
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Location search input */}
                        <div className="relative">
                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    id="location"
                                    placeholder="Search for a place or address..."
                                    value={locationInput}
                                    onChange={(e) => handleLocationInputChange(e.target.value)}
                                    onFocus={handleInputFocus}
                                    autoComplete="off"
                                    className="pr-10"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {isSearching ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : (
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {showDropdown && hasResults && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg max-h-72 overflow-auto"
                                >
                                    {/* Saved Locations Section */}
                                    {savedResults.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide bg-zinc-800/50 border-b border-zinc-700">
                                                Saved Locations
                                            </div>
                                            {savedResults.map((result, index) => (
                                                <button
                                                    key={`saved-${index}`}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none border-b border-zinc-800 last:border-b-0"
                                                    onClick={() => handleSelectLocation(result)}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <Star className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500 fill-yellow-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">{result.label}</div>
                                                            <div className="text-xs text-zinc-400 truncate">{result.address}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search Results Section */}
                                    {mapboxResults.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide bg-zinc-800/50 border-b border-zinc-700">
                                                Search Results
                                            </div>
                                            {mapboxResults.map((result, index) => (
                                                <button
                                                    key={`mapbox-${index}`}
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none border-b border-zinc-800 last:border-b-0"
                                                    onClick={() => handleSelectLocation(result)}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">{result.label}</div>
                                                            <div className="text-xs text-zinc-400 truncate">{result.address}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {locations.length > 0 && (
                            <p className="text-xs text-green-500">
                                {locations.length} location{locations.length > 1 ? 's' : ''} added
                            </p>
                        )}

                        {/* Hidden input for form submission */}
                        <input type="hidden" name="locations" value={JSON.stringify(locations)} />
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
