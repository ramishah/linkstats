'use client'

import { ManageSignificantLocationsDialog } from "@/components/add-significant-location-dialog"
import { AddLinkDialog } from "@/components/add-link-dialog"

interface HistoryPageActionsProps {
    friends: any[]
    distinctLocations: string[]
    significantLocations: any[]
}

export function HistoryPageActions({ friends, distinctLocations, significantLocations }: HistoryPageActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <ManageSignificantLocationsDialog
                distinctLocations={distinctLocations}
                significantLocations={significantLocations}
            />
            <AddLinkDialog friends={friends} />
        </div>
    )
}
