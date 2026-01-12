'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Flop = {
    link_date: string
    purpose: string
    reason: string | null
}

type FriendFlops = {
    id: string
    name: string
    flops: Flop[]
}

export function FlopWall({ friends, allFlops }: { friends: any[], allFlops: any[] }) {
    const [selectedFriend, setSelectedFriend] = useState<string>('all')

    // Process data to group flops by friend
    const friendFlops: Record<string, Flop[]> = {}

    allFlops.forEach(flop => {
        if (!friendFlops[flop.profile_id]) {
            friendFlops[flop.profile_id] = []
        }
        friendFlops[flop.profile_id].push({
            link_date: flop.links.date,
            purpose: flop.links.purpose,
            reason: flop.flop_reason
        })
    })

    const filteredFlops = selectedFriend === 'all'
        ? allFlops.map(f => ({
            name: f.profiles.name,
            link_date: f.links.date,
            purpose: f.links.purpose,
            reason: f.flop_reason
        }))
        : friendFlops[selectedFriend]?.map(f => ({
            name: friends.find(fr => fr.id === selectedFriend)?.name,
            ...f
        })) || []

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Flop Wall of Shame</CardTitle>
                    <div className="flex-1 flex justify-end">
                        <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                            <SelectTrigger className="w-auto text-right justify-end gap-2 px-3">
                                <SelectValue placeholder="Select Member" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="all">All Members</SelectItem>
                                {friends.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="space-y-4 h-full overflow-y-auto pr-2">
                    {filteredFlops.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No flops recorded... yet.</p>
                    ) : (
                        filteredFlops.map((item: any, idx: number) => (
                            <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-destructive">{item.name}</span>
                                    <span className="text-xs text-muted-foreground">{new Date(item.link_date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm font-medium">{item.purpose}</p>
                                {item.reason && (
                                    <p className="text-sm text-muted-foreground mt-1 italic">Flop Reason: "{item.reason}"</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
