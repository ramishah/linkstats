import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function AddLinkButtonSkeleton() {
    return (
        <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Link
        </Button>
    )
}

export function StatsCardsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            <Skeleton className="h-4 w-[100px]" />
                        </CardTitle>
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[60px] mb-1" />
                        <Skeleton className="h-3 w-[120px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function OverviewSkeleton({ className }: { className?: string }) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-[150px]" /></CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <Skeleton className="h-[350px] w-full" />
            </CardContent>
        </Card>
    )
}

export function FlopWallSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-[100px]" /></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function RecentLinksSkeleton() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-[120px]" /></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-3 w-[150px]" />
                            </div>
                            <div className="ml-auto">
                                <Skeleton className="h-4 w-[80px]" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function MemberStatusSkeleton() {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-[140px]" /></CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[100px]" />
                                    <Skeleton className="h-3 w-[60px]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export function MapSkeleton() {
    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle><Skeleton className="h-6 w-[120px]" /></CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-0">
                <Skeleton className="h-full w-full rounded-b-lg" />
            </CardContent>
        </Card>
    )
}
