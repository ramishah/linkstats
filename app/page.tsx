import { getDashboardStats, getRecentLinks, getFriends, getFlops } from "@/lib/data";
import { Overview } from "@/components/overview";
import { FlopWall } from "@/components/flop-wall";
import { MemberStatus } from "@/components/member-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Users, UserMinus } from "lucide-react";
import { AddLinkDialog } from "@/components/add-link-dialog";

export const revalidate = 0; // Ensure fresh data on every load

export default async function Home() {
  const stats = await getDashboardStats();
  const recentLinks = await getRecentLinks();
  const friends = await getFriends();
  const flops = await getFlops();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">The Link Stats</h2>
        <AddLinkDialog friends={friends} />
      </div>
      <div className="flex items-center justify-left">
        A dashboard to show statistics about lads link ups. All data is from the start of 2026 onwards.
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLinks}</div>
            <p className="text-xs text-muted-foreground">All time hangouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.avgDuration / 60)}h {stats.avgDuration % 60}m
            </div>
            <p className="text-xs text-muted-foreground">Average link time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Flopper</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topFlopper}</div>
            <p className="text-xs text-muted-foreground">Most frequent flopper</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendance}%</div>
            <p className="text-xs text-muted-foreground">Overall attendance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* @ts-ignore */}
        <Overview className="col-span-3 h-128" data={stats.attendanceData} />

        <div className="col-span-4 h-128">
          <FlopWall friends={friends} allFlops={flops} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-3">
          <MemberStatus friends={friends} />
        </div>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent links found.</p>
              ) : (
                recentLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{link.purpose || 'Hangout'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(link.date).toLocaleDateString()} at {link.location_name || 'Unknown'}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {Math.floor(link.duration_minutes / 60)}h {link.duration_minutes % 60}m
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
