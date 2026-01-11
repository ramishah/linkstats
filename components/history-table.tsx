'use client'

import { deleteLink } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Trash2, Pencil } from 'lucide-react'
import Link from 'next/link'

export function HistoryTable({ links }: { links: any[] }) {
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
                            // Calculate members string
                            // @ts-ignore
                            const attendees = link.link_members.filter(m => !m.is_flop).map(m => m.profiles.name).join(', ')
                            // @ts-ignore
                            const floppers = link.link_members.filter(m => m.is_flop).map(m => m.profiles.name).join(', ')

                            return (
                                <TableRow key={link.id}>
                                    <TableCell>{new Date(link.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-medium">{link.purpose}</TableCell>
                                    <TableCell>{link.location_name}</TableCell>
                                    <TableCell>{link.duration_minutes}m</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{attendees}</span>
                                            {floppers && <span className="text-red-500 text-xs text-muted-foreground">Flops: {floppers}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/edit/${link.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
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
