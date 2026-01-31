import { SignificantLocation, LocationSearchResult } from './types'

export interface GeocodingResult {
    lat: number
    lng: number
    display_name: string
}

interface MapboxSuggestion {
    name: string
    mapbox_id: string
    feature_type: string
    full_address?: string
    place_formatted?: string
    context?: {
        place?: { name: string }
        region?: { name: string; region_code?: string }
        postcode?: { name: string }
        country?: { name: string; country_code?: string }
    }
}

interface MapboxSuggestResponse {
    suggestions: MapboxSuggestion[]
}

interface MapboxRetrieveFeature {
    properties: {
        name: string
        full_address?: string
        coordinates?: {
            latitude: number
            longitude: number
        }
    }
    geometry: {
        coordinates: [number, number] // [lng, lat]
    }
}

interface MapboxRetrieveResponse {
    features: MapboxRetrieveFeature[]
}

/**
 * Format address from Mapbox Search Box API suggestion
 * Returns the full_address or place_formatted, or constructs from context
 */
function formatSuggestionAddress(suggestion: MapboxSuggestion): string {
    // Prefer full_address if available
    if (suggestion.full_address) {
        return suggestion.full_address
    }

    // Fall back to place_formatted
    if (suggestion.place_formatted) {
        return `${suggestion.name}, ${suggestion.place_formatted}`
    }

    // Construct from context
    const parts: string[] = [suggestion.name]
    const ctx = suggestion.context

    if (ctx?.place?.name) {
        parts.push(ctx.place.name)
    }

    if (ctx?.region?.region_code) {
        const postcode = ctx?.postcode?.name || ''
        parts.push(postcode ? `${ctx.region.region_code} ${postcode}` : ctx.region.region_code)
    } else if (ctx?.region?.name) {
        parts.push(ctx.region.name)
    }

    return parts.join(', ')
}

/**
 * Search using Mapbox Search Box API (better POI support than Geocoding v5)
 * Returns clean formatted addresses with lat/lng
 */
export async function searchMapbox(query: string): Promise<LocationSearchResult[]> {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!token) {
        console.warn('Mapbox token not configured, falling back to Nominatim')
        return searchNominatimAsResults(query)
    }

    if (!query.trim() || query.length < 2) return []

    try {
        // Step 1: Get suggestions from Search Box API
        const suggestUrl = new URL('https://api.mapbox.com/search/searchbox/v1/suggest')
        suggestUrl.searchParams.set('q', query)
        suggestUrl.searchParams.set('access_token', token)
        suggestUrl.searchParams.set('country', 'CA')
        suggestUrl.searchParams.set('limit', '5')
        suggestUrl.searchParams.set('language', 'en')
        suggestUrl.searchParams.set('session_token', 'linkstats-session')

        const suggestResponse = await fetch(suggestUrl.toString())

        if (!suggestResponse.ok) {
            console.error('Mapbox suggest failed:', suggestResponse.status)
            return searchNominatimAsResults(query)
        }

        const suggestData: MapboxSuggestResponse = await suggestResponse.json()

        if (!suggestData.suggestions || suggestData.suggestions.length === 0) {
            return []
        }

        // Step 2: Retrieve full details (including coordinates) for each suggestion in parallel
        const retrievePromises = suggestData.suggestions.map(async (suggestion) => {
            try {
                const retrieveUrl = new URL(`https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}`)
                retrieveUrl.searchParams.set('access_token', token)
                retrieveUrl.searchParams.set('session_token', 'linkstats-session')

                const retrieveResponse = await fetch(retrieveUrl.toString())

                if (retrieveResponse.ok) {
                    const retrieveData: MapboxRetrieveResponse = await retrieveResponse.json()

                    if (retrieveData.features && retrieveData.features.length > 0) {
                        const feature = retrieveData.features[0]
                        const coords = feature.geometry.coordinates

                        return {
                            type: 'mapbox' as const,
                            label: suggestion.name,
                            address: feature.properties.full_address || formatSuggestionAddress(suggestion),
                            lat: coords[1],
                            lng: coords[0]
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to retrieve suggestion:', suggestion.name)
            }
            return null
        })

        const results = await Promise.all(retrievePromises)
        return results.filter((r) => r !== null)
    } catch (error) {
        console.error('Mapbox error:', error)
        return searchNominatimAsResults(query)
    }
}

/**
 * Search significant locations by label or address
 */
export function searchSignificantLocations(
    query: string,
    significantLocations: SignificantLocation[]
): LocationSearchResult[] {
    if (!query.trim()) {
        // Return all locations with coordinates when no query
        return significantLocations
            .filter(loc => loc.location_lat && loc.location_lng)
            .map(loc => ({
                type: 'saved' as const,
                label: loc.label,
                address: loc.address,
                lat: loc.location_lat!,
                lng: loc.location_lng!
            }))
    }

    const lowerQuery = query.toLowerCase()

    return significantLocations
        .filter(loc => {
            if (!loc.location_lat || !loc.location_lng) return false
            return (
                loc.label.toLowerCase().includes(lowerQuery) ||
                loc.address.toLowerCase().includes(lowerQuery)
            )
        })
        .map(loc => ({
            type: 'saved' as const,
            label: loc.label,
            address: loc.address,
            lat: loc.location_lat!,
            lng: loc.location_lng!
        }))
}

/**
 * Fallback: Search using Nominatim (OpenStreetMap)
 * Returns results in LocationSearchResult format
 */
async function searchNominatimAsResults(query: string): Promise<LocationSearchResult[]> {
    const results = await searchLocations(query)
    return results.map(r => ({
        type: 'mapbox' as const, // Still labeled as mapbox for UI consistency
        label: r.display_name.split(',')[0],
        address: r.display_name,
        lat: r.lat,
        lng: r.lng
    }))
}

/**
 * Original Nominatim search - kept for backwards compatibility
 */
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query.trim() || query.length < 3) return []

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
            {
                headers: {
                    'User-Agent': 'LinkStats/1.0'
                }
            }
        )

        if (!response.ok) {
            console.error('Geocoding request failed:', response.status)
            return []
        }

        const results = await response.json()

        return results.map((result: any) => ({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            display_name: result.display_name
        }))
    } catch (error) {
        console.error('Geocoding error:', error)
        return []
    }
}
