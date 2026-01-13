"use client"

import { useMemo } from "react"
import { Map as MapComponent, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip, MapControls } from "@/components/ui/map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LinkLocation {
    id: string
    purpose: string
    location_name: string
    location_lat: number
    location_lng: number
    date: string
}

interface LocationMapProps {
    links: LinkLocation[]
}

interface GroupedLocation {
    lat: number
    lng: number
    location_name: string
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
        } else {
            groups[key] = {
                lat: link.location_lat,
                lng: link.location_lng,
                location_name: link.location_name,
                links: [link]
            }
        }
    }

    return Object.values(groups)
}

export function LocationMap({ links }: LocationMapProps) {
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
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle>Link Locations</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-0 overflow-hidden rounded-b-lg">
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
                                    <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                                    {group.links.length > 1 && (
                                        <div className="absolute -top-2 -right-2 size-5 rounded-full bg-red-500 border border-white text-[10px] font-bold text-white flex items-center justify-center">
                                            {group.links.length}
                                        </div>
                                    )}
                                </div>
                            </MarkerContent>
                            <MarkerTooltip>
                                {group.location_name}
                                {group.links.length > 1 && ` (${group.links.length} links)`}
                            </MarkerTooltip>
                            <MarkerPopup>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    <p className="text-xs text-muted-foreground font-medium">{group.location_name}</p>
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
