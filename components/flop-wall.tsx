'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AddFlopDialog } from "@/components/add-flop-dialog"
import { UnifiedFlop } from "@/lib/types"

export function FlopWall({ friends, allFlops }: { friends: any[], allFlops: UnifiedFlop[] }) {
    const [selectedFriend, setSelectedFriend] = useState<string>('all')

    const filteredFlops = selectedFriend === 'all'
        ? allFlops
        : allFlops.filter(f => f.profile_id === selectedFriend)

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Flop Wall of Shame</CardTitle>
                    <div className="flex items-center gap-2">
                        <AddFlopDialog friends={friends} />
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
                        filteredFlops.map((item: UnifiedFlop, idx: number) => (
                            <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-destructive">{item.name}</span>
                                        {item.is_link_ender && (
                                            <Badge variant="destructive" className="text-xs">LINK ENDER</Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {item.flop_date ? new Date(item.flop_date).toLocaleDateString() : 'Unknown date'}
                                    </span>
                                </div>
                                <p className="text-sm font-medium">
                                    {item.is_standalone ? 'Standalone flop' : item.purpose || 'Unknown activity'}
                                </p>
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
