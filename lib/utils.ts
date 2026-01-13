import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string): string {
  if (!address) return ''
  const parts = address.split(',').map(p => p.trim())

  // Check if the first part starts with a number (e.g. "17600")
  const isStartNumber = /^\d/.test(parts[0])

  if (isStartNumber) {
    // Logic: first part + second part, fifth part
    // Indices: 0 + 1, 4
    if (parts.length >= 5) {
      return `${parts[0]} ${parts[1]}, ${parts[4]}`
    }
  } else {
    // Logic: first part, second part + third part, sixth part
    // Indices: 0, 1 + 2, 5
    if (parts.length >= 6) {
      return `${parts[0]}, ${parts[1]} ${parts[2]}, ${parts[5]}`
    }
  }

  // Fallback if structure doesn't match expected length
  if (parts.length > 3) {
    return parts.slice(0, 3).join(', ')
  }
  return address
}
