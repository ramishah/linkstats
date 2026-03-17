"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LinkHeatmapProps {
    linkDates: string[]
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]

function toLocalDateStr(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
}

export function LinkHeatmap({ linkDates }: LinkHeatmapProps) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Convert UTC timestamps to local date strings
    const dateSet = new Set(linkDates.map((d) => toLocalDateStr(new Date(d))))

    // Determine available years from local dates
    const years = [...new Set([...dateSet].map((d) => d.slice(0, 4)))].sort()
    const now = new Date()
    const currentYear = String(now.getFullYear())
    // Ensure current year is always an option
    if (!years.includes(currentYear)) years.push(currentYear)

    const [selectedYear, setSelectedYear] = useState(currentYear)

    const yearNum = parseInt(selectedYear)
    const todayStr = toLocalDateStr(now)

    if (!mounted) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Link Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[120px]" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Link Activity</CardTitle>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2 lg:justify-between lg:gap-0 lg:overflow-visible lg:pb-0">
                    {Array.from({ length: 12 }, (_, mo) => {
                        const daysInMonth = new Date(yearNum, mo + 1, 0).getDate()
                        const firstDayJs = new Date(yearNum, mo, 1).getDay()
                        const startOffset = (firstDayJs + 6) % 7
                        const monthStart = `${selectedYear}-${String(mo + 1).padStart(2, "0")}-01`
                        const isFutureMonth = monthStart > todayStr

                        const cells: (string | null)[] = Array(startOffset).fill(null)
                        for (let d = 1; d <= daysInMonth; d++) {
                            const dateStr = `${selectedYear}-${String(mo + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                            cells.push(dateStr)
                        }

                        return (
                            <div key={mo} className={`shrink-0 ${isFutureMonth ? "opacity-30" : ""}`}>
                                <p className="text-xs text-muted-foreground mb-1">{MONTH_NAMES[mo]}</p>
                                <div className="grid grid-cols-7 gap-[6px]">
                                    {DAY_LABELS.map((dl, i) => (
                                        <span key={i} className="w-3.5 h-3.5 text-[7px] text-muted-foreground flex items-center justify-center">
                                            {dl}
                                        </span>
                                    ))}
                                    {cells.map((dateStr, i) =>
                                        dateStr === null ? (
                                            <span key={`empty-${i}`} className="w-3.5 h-3.5" />
                                        ) : (
                                            <span
                                                key={dateStr}
                                                className={`w-3.5 h-3.5 rounded-sm ${dateSet.has(dateStr)
                                                    ? "bg-white"
                                                    : dateStr > todayStr
                                                        ? "bg-zinc-800/20 border border-zinc-800"
                                                        : "bg-zinc-800/50 border border-zinc-700"
                                                    }`}
                                                title={dateStr}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
