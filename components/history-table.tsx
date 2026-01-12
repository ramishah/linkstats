'use client'

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
import { Trash2 } from 'lucide-react'
import { EditLinkDialog } from '@/components/edit-link-dialog'

export function HistoryTable({ links, friends }: { links: any[], friends: any[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {links.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
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

                            return (
                                <TableRow key={link.id}>
                                    <TableCell>{new Date(link.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{link.purpose}</TableCell>
                                    <TableCell>{link.location_name}</TableCell>
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
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
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
        </div>
    )
}
