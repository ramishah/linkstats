"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

interface OverviewProps {
    data: { name: string, total: number }[];
    className?: string;
}

const chartConfig = {
    total: {
        label: "Links",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

export function Overview({ data, className }: OverviewProps) {
    if (!data?.length) return (
        <Card className={className}>
            <CardContent className="flex h-[200px] items-center justify-center text-muted-foreground">
                No data available
            </CardContent>
        </Card>
    )

    const topLinker = data[0]

    return (
        <Card className={`h-full flex flex-col ${className || ''}`}>
            <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>All-time Link Attendance</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <BarChart
                        accessibilityLayer
                        data={data}
                        layout="vertical"
                        margin={{
                            left: 0,
                        }}
                    >
                        <XAxis type="number" dataKey="total" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            width={100}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="total" fill="var(--chart-1)" radius={5} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Top Linker: {topLinker?.name} ({topLinker?.total}) <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing active members ranked by attendance
                </div>
            </CardFooter>
        </Card>
    )
}
