'use client'

import { createLink, updateLink } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface LinkFormProps {
    friends: any[]
    initialData?: any
    isEdit?: boolean
}

export function LinkForm({ friends, initialData, isEdit = false }: LinkFormProps) {
    // Parse initial members if editing
    const initialAttendees = new Set(
        initialData?.link_members
            ?.filter((m: any) => !m.is_flop)
            .map((m: any) => m.profile_id) || []
    )
    const initialFloppers = new Set(
        initialData?.link_members
            ?.filter((m: any) => m.is_flop)
            .map((m: any) => m.profile_id) || []
    )

    const defaultDate = initialData?.date
        ? new Date(initialData.date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)

    const action = isEdit ? updateLink.bind(null, initialData.id) : createLink

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Link' : 'Log a New Link'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={action} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date & Time</Label>
                            <Input
                                id="date"
                                name="date"
                                type="datetime-local"
                                required
                                defaultValue={defaultDate}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                name="duration"
                                type="number"
                                min="1"
                                defaultValue={initialData?.duration_minutes || "60"}
                                required
                            />
                        </div>
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
                        <Input
                            id="location"
                            name="location"
                            placeholder="e.g. Starbucks, Rami's House"
                            defaultValue={initialData?.location_name || ''}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-base">Attendees (Who came)</Label>
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
                            <Label className="text-base text-red-500">Floppers (Who skipped)</Label>
                            <div className="grid grid-cols-1 gap-2">
                                {friends.map((friend) => (
                                    <div key={`flopper-${friend.id}`} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={`flopper-${friend.id}`}
                                            name="floppers"
                                            value={friend.id}
                                            defaultChecked={initialFloppers.has(friend.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-destructive focus:ring-destructive bg-zinc-900 border-zinc-700"
                                        />
                                        <label htmlFor={`flopper-${friend.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {friend.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full">
                        {isEdit ? 'Update Link' : 'Save Link'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
