"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

export interface LightboxMedia {
    url: string
    type: 'image' | 'video'
}

interface LightboxProps {
    media: LightboxMedia[]
    currentIndex: number
    onClose: () => void
    onNavigate: (index: number) => void
    onMediaError?: () => void
}

export function Lightbox({ media, currentIndex, onClose, onNavigate, onMediaError }: LightboxProps) {
    const [loading, setLoading] = useState(false)

    // Reset loading state when navigating to a new item
    useEffect(() => {
        setLoading(true)
    }, [currentIndex])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                onNavigate(currentIndex - 1)
            } else if (e.key === 'ArrowRight' && currentIndex < media.length - 1) {
                onNavigate(currentIndex + 1)
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, media.length, onClose, onNavigate])

    if (!media[currentIndex] || typeof document === 'undefined') return null

    return createPortal(
        <div
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <button
                className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors z-10"
                onClick={onClose}
            >
                <X className="h-6 w-6 text-white" />
            </button>

            {/* Left arrow */}
            {currentIndex > 0 && (
                <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                    onClick={() => onNavigate(currentIndex - 1)}
                >
                    <ChevronLeft className="h-6 w-6 text-white" />
                </button>
            )}

            {/* Right arrow */}
            {currentIndex < media.length - 1 && (
                <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                    onClick={() => onNavigate(currentIndex + 1)}
                >
                    <ChevronRight className="h-6 w-6 text-white" />
                </button>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Loader2 className="h-8 w-8 animate-spin text-white/70" />
                </div>
            )}

            {media[currentIndex].type === 'video' ? (
                <video
                    key={currentIndex}
                    src={media[currentIndex].url}
                    controls
                    autoPlay
                    className={`max-w-[90vw] max-h-[90vh] object-contain transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
                    onCanPlay={() => setLoading(false)}
                    onError={() => {
                        console.error('[Lightbox] Video load error:', media[currentIndex].url.substring(0, 80))
                        setLoading(false)
                        onMediaError?.()
                    }}
                />
            ) : (
                <img
                    src={media[currentIndex].url}
                    alt="Full size"
                    className={`max-w-[90vw] max-h-[90vh] object-contain transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        console.error('[Lightbox] Image load error:', media[currentIndex].url.substring(0, 80))
                        setLoading(false)
                        onMediaError?.()
                    }}
                />
            )}

            {/* Media counter */}
            {media.length > 1 && (
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70 bg-black/50 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {media.length}
                </span>
            )}
        </div>,
        document.body
    )
}
