import { getRecentLinks } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatAddress } from "@/lib/utils"

export async function RecentLinksList() {
    const recentLinks = await getRecentLinks()

    return (
        <Card className="col-span-1 md:col-span-1 lg:col-span-4 h-full w-full">
            <CardHeader>
                <CardTitle>Recent Links</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {recentLinks.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent links found.</p>
                    ) : (
                        recentLinks.map((link: any) => {
                            const locations = link.link_locations || []
                            const locationText = locations.length > 0
                                ? locations.map((loc: any) => formatAddress(loc.location_name)).join(', ')
                                : 'Unknown'
                            return (
                                <div key={link.id} className="flex items-center justify-between gap-4">
                                    <div className="space-y-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{link.purpose || 'Hangout'}</p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {new Date(link.date).toLocaleDateString()} at {locationText}
                                        </p>
                                    </div>
                                    <div className="font-medium whitespace-nowrap shrink-0">
                                        {Math.floor(link.duration_minutes / 60)}h {link.duration_minutes % 60}m
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
