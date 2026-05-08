"use client"

import dynamic from "next/dynamic"
import { OverviewSkeleton } from "@/components/skeletons"

export const Overview = dynamic(
    () => import("@/components/overview").then(m => m.Overview),
    {
        ssr: false,
        loading: () => <OverviewSkeleton className="h-full" />,
    }
)
