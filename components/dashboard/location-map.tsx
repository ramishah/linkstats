"use client"

import { useMemo } from "react"
import { formatAddress } from "@/lib/utils"
import { Map as MapComponent, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip, MapControls } from "@/components/ui/map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LinkLocation {
    id: string
    purpose: string
    location_name: string
    location_label?: string
    location_lat: number
    location_lng: number
    date: string
}

import { Badge } from "@/components/ui/badge"

interface LocationMapProps {
    links: LinkLocation[]
    significantLocations?: { address: string; label: string }[]
}

interface GroupedLocation {
    lat: number
    lng: number
    location_name: string
    location_label?: string
    links: LinkLocation[]
}

function calculateCenter(groups: GroupedLocation[]): [number, number] {
    if (groups.length === 0) {
        return [0, 0]
    }

    const sumLat = groups.reduce((acc, g) => acc + g.lat, 0)
    const sumLng = groups.reduce((acc, g) => acc + g.lng, 0)

    return [sumLng / groups.length, sumLat / groups.length]
}

function groupLinksByLocation(links: LinkLocation[]): GroupedLocation[] {
    const groups: Record<string, GroupedLocation> = {}

    for (const link of links) {
        // Round to 5 decimal places to group nearby locations
        const key = `${link.location_lat.toFixed(5)},${link.location_lng.toFixed(5)}`

        if (groups[key]) {
            groups[key].links.push(link)
            // Prefer a label if any link at this location has one
            if (!groups[key].location_label && link.location_label) {
                groups[key].location_label = link.location_label
            }
        } else {
            groups[key] = {
                lat: link.location_lat,
                lng: link.location_lng,
                location_name: link.location_name,
                location_label: link.location_label,
                links: [link]
            }
        }
    }

    return Object.values(groups)
}

export function LocationMap({ links, significantLocations = [] }: LocationMapProps) {
    const groupedLocations = useMemo(() => groupLinksByLocation(links), [links])

    if (links.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Link Locations</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground text-sm">
                        No locations recorded yet. Add a location when creating or editing a link.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const center = calculateCenter(groupedLocations)

    return (
        <Card className="h-full pb-0 overflow-hidden">
            <CardHeader>
                <CardTitle>Link Locations</CardTitle>
                <CardDescription>
                    Click on a location to view the links at that location.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
                <MapComponent
                    center={center}
                    zoom={11}
                    styles={{
                        dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                        light: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    }}
                >
                    <MapControls position="bottom-right" showZoom={true} />
                    {groupedLocations.map((group, index) => (
                        <MapMarker
                            key={`${group.lat}-${group.lng}-${index}`}
                            longitude={group.lng}
                            latitude={group.lat}
                        >
                            <MarkerContent>
                                <div className="relative">
                                    {group.links.length > 1 ? (
                                        <div className="size-6 rounded-full bg-black border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white">
                                            {group.links.length}
                                        </div>
                                    ) : (
                                        <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                                    )}
                                </div>
                            </MarkerContent>
                            <MarkerTooltip>
                                {(() => {
                                    const label = group.location_label
                                        || significantLocations?.find(l => l.address === group.location_name)?.label
                                    return label ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-background text-foreground border-foreground/20">
                                                {label}
                                            </Badge>
                                            {group.links.length > 1 && <span className="text-xs">({group.links.length} links)</span>}
                                        </div>
                                    ) : (
                                        <>
                                            {formatAddress(group.location_name)}
                                            {group.links.length > 1 && ` (${group.links.length} links)`}
                                        </>
                                    )
                                })()}
                            </MarkerTooltip>
                            <MarkerPopup>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {(() => {
                                        const label = group.location_label
                                            || significantLocations?.find(l => l.address === group.location_name)?.label
                                        return label ? (
                                            <Badge variant="outline" className="mb-2 bg-background text-foreground border-foreground/20">
                                                {label}
                                            </Badge>
                                        ) : (
                                            <p className="text-xs text-muted-foreground font-medium">{formatAddress(group.location_name)}</p>
                                        )
                                    })()}
                                    <div className="space-y-2">
                                        {group.links.map((link) => (
                                            <div key={link.id} className="border-t border-border pt-2 first:border-t-0 first:pt-0">
                                                <p className="font-medium text-foreground text-sm">{link.purpose}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(link.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </MarkerPopup>
                        </MapMarker>
                    ))}
                </MapComponent>
            </CardContent>
        </Card>
    )
}
