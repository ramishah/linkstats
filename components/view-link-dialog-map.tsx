"use client"

import { Map as MapComponent, MapMarker, MarkerContent, MarkerPopup, MarkerTooltip, MapControls } from "@/components/ui/map"
import { Badge } from "@/components/ui/badge"
import { formatAddress } from "@/lib/utils"

interface ViewLinkDialogMapProps {
    center: [number, number]
    locations: any[]
    significantLocations: any[]
}

export function ViewLinkDialogMap({ center, locations, significantLocations }: ViewLinkDialogMapProps) {
    return (
        <div className="h-[250px] rounded-lg overflow-hidden outline-none [&_canvas]:outline-none">
            <MapComponent
                center={center}
                zoom={13}
                styles={{
                    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
                    light: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                }}
            >
                <MapControls position="bottom-right" showZoom={true} />
                {locations.map((loc: any, i: number) => {
                    const label = loc.location_label
                        || significantLocations?.find((sl: any) => sl.address === loc.location_name)?.label
                    return (
                        <MapMarker
                            key={i}
                            longitude={loc.location_lng}
                            latitude={loc.location_lat}
                        >
                            <MarkerContent>
                                <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
                            </MarkerContent>
                            <MarkerTooltip>
                                {label ? (
                                    <Badge variant="outline" className="bg-background text-foreground border-foreground/20">
                                        {label}
                                    </Badge>
                                ) : (
                                    formatAddress(loc.location_name)
                                )}
                            </MarkerTooltip>
                            <MarkerPopup>
                                <div className="space-y-1 max-w-[250px]">
                                    {label ? (
                                        <Badge variant="outline" className="bg-background text-foreground border-foreground/20">
                                            {label}
                                        </Badge>
                                    ) : null}
                                    <p className="text-xs text-muted-foreground break-words">
                                        {formatAddress(loc.location_name)}
                                    </p>
                                </div>
                            </MarkerPopup>
                        </MapMarker>
                    )
                })}
            </MapComponent>
        </div>
    )
}
