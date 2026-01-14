import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ''

  const parts = address.split(',').map(p => p.trim())
  if (parts.length === 0) return address

  const firstPart = parts[0]
  const startsWithNumber = /^\d/.test(firstPart)

  if (startsWithNumber && parts.length >= 2) {
    // Format: "77, Jeanette Street, ..." → "77 Jeanette Street, City"
    const streetAddress = `${parts[0]} ${parts[1]}`
    // Find city (usually 3rd or 4th part, skip neighborhood)
    const city = parts.length >= 4 ? parts[3] : parts[2] || ''
    return city ? `${streetAddress}, ${city}` : streetAddress
  } else if (!startsWithNumber && parts.length >= 3) {
    // Format: "Upper Canada Mall, 17600, Yonge Street, ..." → "Upper Canada Mall, 17600 Yonge Street"
    const placeName = parts[0]
    // Check if second part is a number (street number)
    if (/^\d/.test(parts[1]) && parts.length >= 3) {
      return `${placeName}, ${parts[1]} ${parts[2]}`
    }
    // Otherwise just place name and next part
    return `${placeName}, ${parts[1]}`
  }

  // Fallback: first 2 parts
  return parts.slice(0, 2).join(', ')
}
