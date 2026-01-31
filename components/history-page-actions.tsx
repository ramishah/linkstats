'use client'

import { ManageSignificantLocationsDialog } from "@/components/add-significant-location-dialog"
import { AddLinkDialog } from "@/components/add-link-dialog"

interface LinkLocation {
    location_name: string
    location_lat: number
    location_lng: number
}

interface HistoryPageActionsProps {
    friends: any[]
    distinctLocations: string[]
    significantLocations: any[]
    linkLocations?: LinkLocation[]
}

export function HistoryPageActions({ friends, distinctLocations, significantLocations, linkLocations = [] }: HistoryPageActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <ManageSignificantLocationsDialog
                distinctLocations={distinctLocations}
                significantLocations={significantLocations}
                linkLocations={linkLocations}
            />
            <AddLinkDialog friends={friends} significantLocations={significantLocations} />
        </div>
    )
}
