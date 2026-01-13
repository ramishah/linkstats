import { Suspense } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentLinksList } from "@/components/dashboard/recent-links-list"
import { OverviewWrapper } from "@/components/dashboard/overview-wrapper"
import { FlopWallWrapper } from "@/components/dashboard/flop-wall-wrapper"
import { MemberStatusWrapper } from "@/components/dashboard/member-status-wrapper"
import { AddLinkDialogWrapper } from "@/components/dashboard/add-link-dialog-wrapper"
import { LocationMapWrapper } from "@/components/dashboard/location-map-wrapper"
import {
  StatsCardsSkeleton,
  OverviewSkeleton,
  FlopWallSkeleton,
  MemberStatusSkeleton,
  RecentLinksSkeleton,
  AddLinkButtonSkeleton,
  MapSkeleton
} from "@/components/skeletons"

export const revalidate = 0; // Ensure fresh data on every load

export default function Home() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">The Link Stats</h2>
        <Suspense fallback={<AddLinkButtonSkeleton />}>
          <AddLinkDialogWrapper />
        </Suspense>
      </div>
      <div className="flex items-center justify-left">
        A dashboard to show statistics about lads link ups. All data is from the start of 2026 onwards.
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<MapSkeleton />}>
        <LocationMapWrapper />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-1 md:col-span-1 lg:col-span-3 h-[350px] md:h-[500px]">
          <Suspense fallback={<OverviewSkeleton className="h-full" />}>
            <OverviewWrapper className="h-full" />
          </Suspense>
        </div>

        <div className="col-span-1 md:col-span-1 lg:col-span-4 h-128">
          <Suspense fallback={<FlopWallSkeleton />}>
            <FlopWallWrapper />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Suspense fallback={<MemberStatusSkeleton />}>
          <MemberStatusWrapper />
        </Suspense>

        <Suspense fallback={<RecentLinksSkeleton />}>
          <RecentLinksList />
        </Suspense>
      </div>
    </div>
  );
}
