import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MemberStatusProps {
    friends: any[]
}

const INACTIVE_REASONS = [
    "Moved back home",
    "Ghosted the group",
    "Too busy with work",
    "Retired from hanging out",
    "In a coding bootcamp",
    "Disappeared into the void"
]

export function MemberStatus({ friends }: MemberStatusProps) {
    const activeFriends = friends.filter(f => f.is_active !== false)
    const inactiveFriends = friends.filter(f => f.is_active === false)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Member Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Active ({activeFriends.length})</h4>
                        <div className="flex flex-wrap gap-2">
                            {activeFriends.map(friend => (
                                <Badge key={friend.id} variant="secondary" className="px-3 py-1">
                                    {friend.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Inactive ({inactiveFriends.length})</h4>
                        <div className="h-[200px] w-full rounded-md border p-4 overflow-y-auto">
                            <div className="space-y-4">
                                {inactiveFriends.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No inactive members</p>
                                ) : (
                                    inactiveFriends.map(friend => {
                                        const randomReason = INACTIVE_REASONS[Math.floor(Math.random() * INACTIVE_REASONS.length)]
                                        return (
                                            <div key={friend.id} className="flex flex-col space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm">{friend.name}</span>
                                                    <Badge variant="outline" className="text-[10px] opacity-70">Inactive</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Reason: {randomReason}</p>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
