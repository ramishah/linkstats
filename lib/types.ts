export interface Location {
    location_name: string
    location_lat: number
    location_lng: number
}

export interface LinkLocation extends Location {
    id: string
    link_id: string
    created_at?: string
}

export interface FlattenedLinkLocation {
    id: string
    purpose: string
    location_name: string
    location_lat: number
    location_lng: number
    date: string
}

export interface UnifiedFlop {
    profile_id: string
    name: string
    flop_date: string
    purpose: string | null
    reason: string | null
    is_link_ender: boolean
    is_standalone: boolean
}
