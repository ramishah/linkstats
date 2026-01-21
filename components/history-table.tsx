'use client'

import { useState } from 'react'
import { deleteLink } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Trash2, Star } from 'lucide-react'
import { EditLinkDialog } from '@/components/edit-link-dialog'
import { RateLinkDialog } from '@/components/rate-link-dialog'
import { ViewLinkDialog } from '@/components/view-link-dialog'
import { formatAddress } from '@/lib/utils'

export function HistoryTable({ links, friends, significantLocations = [] }: { links: any[], friends: any[], significantLocations?: any[] }) {
    const [selectedLink, setSelectedLink] = useState<any>(null)

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {links.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                No links recorded yet.
                            </TableCell>
                        </TableRow>
                    ) : (
                        links.map((link) => {
                            // @ts-ignore
                            const attendees = link.link_members.filter(m => !m.is_flop).map(m => m.profiles.name)
                            // @ts-ignore
                            const floppers = link.link_members.filter(m => m.is_flop).map(m => m.profiles.name)

                            const hours = Math.floor(link.duration_minutes / 60)
                            const minutes = link.duration_minutes % 60
                            const linkLocations = link.link_locations || []
                            const reviews = link.link_reviews || []
                            const avgRating = reviews.length > 0
                                ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                : null

                            return (
                                <TableRow
                                    key={link.id}
                                    className="cursor-pointer hover:bg-zinc-800/50"
                                    onClick={() => setSelectedLink(link)}
                                >
                                    <TableCell>{new Date(link.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{link.purpose}</TableCell>
                                    <TableCell>
                                        {avgRating ? (
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
                                                <Star className="h-3 w-3 fill-yellow-400 mr-1" />
                                                {avgRating}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {linkLocations.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {linkLocations.map((loc: any, i: number) => {
                                                    const sigLoc = significantLocations?.find(
                                                        (sl: any) => sl.address === loc.location_name
                                                    )
                                                    return sigLoc ? (
                                                        <Badge key={i} variant="outline" className="font-normal">
                                                            {sigLoc.label}
                                                        </Badge>
                                                    ) : (
                                                        <span key={i} className="text-sm">
                                                            {formatAddress(loc.location_name)}
                                                            {i < linkLocations.length - 1 && ', '}
                                                        </span>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">No location</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{hours}h {minutes}m</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-1">
                                                {attendees.map((name: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="font-normal hover:bg-zinc-700">
                                                        {name}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {floppers.length > 0 && (
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    <span className="text-xs text-muted-foreground mr-1">Flops:</span>
                                                    {floppers.map((name: string, i: number) => (
                                                        <Badge key={i} variant="destructive" className="font-normal">
                                                            {name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            <RateLinkDialog link={link} friends={friends} />
                                            <EditLinkDialog link={link} friends={friends} />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => await deleteLink(link.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>

            <ViewLinkDialog
                link={selectedLink}
                friends={friends}
                significantLocations={significantLocations}
                open={!!selectedLink}
                onOpenChange={(open) => !open && setSelectedLink(null)}
            />
        </div>
    )
}
