"use client"

import { useState, useEffect } from "react"
import { Link2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { connectPlinkLink } from "@/lib/actions"

interface PlinkLink {
    id: string
    name: string
    created_at: string
}

export function ConnectPlinkDialog({ link, connectedPlinkIds = new Map() }: { link: any, connectedPlinkIds?: Map<string, string> }) {
    const [open, setOpen] = useState(false)
    const [plinkLinks, setPlinkLinks] = useState<PlinkLink[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const isConnected = !!link.plink_link_id

    useEffect(() => {
        if (!open) return
        setSelectedId(link.plink_link_id ?? null)
        setLoading(true)
        fetch('/api/plink/links')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlinkLinks(data)
            })
            .catch(err => console.error('Failed to fetch plink links:', err))
            .finally(() => setLoading(false))
    }, [open, link.plink_link_id])

    const handleConnect = async () => {
        setSaving(true)
        try {
            await connectPlinkLink(link.id, selectedId)
            setOpen(false)
        } catch (error) {
            console.error('Failed to connect:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDisconnect = async () => {
        setSaving(true)
        try {
            await connectPlinkLink(link.id, null)
            setOpen(false)
        } catch (error) {
            console.error('Failed to disconnect:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title={isConnected ? "Connected to plink" : "Connect to plink"}
            >
                <Link2 className={`h-4 w-4 ${isConnected ? "text-blue-400" : ""}`} />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md border-zinc-800 bg-zinc-950">
                    <DialogHeader>
                        <DialogTitle>Connect to Plink</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        {loading ? (
                            <p className="text-sm text-muted-foreground">Loading plink links...</p>
                        ) : plinkLinks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No plink links found.</p>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto space-y-1">
                                {plinkLinks.map((pl) => {
                                    const connectedToLinkId = connectedPlinkIds.get(pl.id)
                                    const isUsedByOther = !!connectedToLinkId && connectedToLinkId !== link.id
                                    return (
                                        <button
                                            key={pl.id}
                                            disabled={isUsedByOther}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                isUsedByOther
                                                    ? "bg-zinc-900/30 border border-zinc-800/50 opacity-50 cursor-not-allowed"
                                                    : selectedId === pl.id
                                                        ? "bg-blue-500/20 border border-blue-500/40"
                                                        : "bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800/50"
                                            }`}
                                            onClick={() => !isUsedByOther && setSelectedId(pl.id)}
                                        >
                                            <div className="font-medium text-sm">{pl.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {isUsedByOther
                                                    ? "Already connected to another link"
                                                    : new Date(pl.created_at).toLocaleDateString()
                                                }
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        <div className="flex justify-between">
                            {isConnected && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDisconnect}
                                    disabled={saving}
                                >
                                    Disconnect
                                </Button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleConnect}
                                    disabled={!selectedId || saving}
                                >
                                    {saving ? "Saving..." : "Connect"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
