'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlusCircle, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const sidebarItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'History', href: '/history', icon: History },
]

export function AppSidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-14 items-center border-b px-4">
                <h1 className="text-xl font-bold tracking-tight">Link Dashboard</h1>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium gap-2">
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={index}
                                href={item.href}
                            >
                                <span
                                    className={cn(
                                        "group flex items-center rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors",
                                        pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
