import { getDashboardStats, getRecentLinks, getFriends, getFlops } from "@/lib/data";
import { Overview } from "@/components/overview";
import { FlopWall } from "@/components/flop-wall";
import { MemberStatus } from "@/components/member-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, Users, UserMinus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LinkForm } from "@/components/link-form";

export const revalidate = 0; // Ensure fresh data on every load

export default async function Home() {
  const stats = await getDashboardStats();
  const recentLinks = await getRecentLinks();
  const friends = await getFriends();
  const flops = await getFlops();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-white text-black hover:bg-zinc-200">
              <Plus className="mr-2 h-4 w-4" /> Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl border-zinc-800 bg-zinc-950 p-0 overflow-hidden">
            <DialogTitle className="sr-only">Log a New Link</DialogTitle>
            <div className="max-h-[90vh] overflow-y-auto">
              <LinkForm friends={friends} />
            </div>
          </DialogContent>
        </Dialog>
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
            <CardTitle className="text-sm font-medium">Flop Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flopRate}%</div>
            <p className="text-xs text-muted-foreground">Overall attendance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* @ts-ignore */}
        <Overview className="col-span-3" data={stats.attendanceData} />

        <div className="col-span-4">
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
