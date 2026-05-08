"use client"

import dynamic from "next/dynamic"
import { MapSkeleton } from "@/components/skeletons"

export const LocationMap = dynamic(
    () => import("@/components/dashboard/location-map").then(m => m.LocationMap),
    {
        ssr: false,
        loading: () => <MapSkeleton />,
    }
)
