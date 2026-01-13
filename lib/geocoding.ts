export interface GeocodingResult {
    lat: number
    lng: number
    display_name: string
}

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
