import { format } from 'date-fns';
import { Activity } from '@/types/database';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ActivityItemProps {
    userName: string;
    activity: Activity;
}

function ActivityItem({ userName, activity }: ActivityItemProps) {
    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200">
            <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-pink-500/30 to-violet-500/30 text-white text-sm">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-sm text-white/60 mt-0.5">{activity.text}</p>
                <p className="text-xs text-white/40 mt-1">
                    {format(new Date(activity.date), 'MMM d, yyyy · h:mm a')}
                </p>
            </div>
        </div>
    );
}

interface RecentActivityFeedProps {
    activities: { userName: string; activity: Activity }[];
    className?: string;
}

export function RecentActivityFeed({ activities, className }: RecentActivityFeedProps) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-white/5 border border-white/10 transition-all duration-300 hover:border-white/20',
                className
            )}
        >
            <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <p className="text-sm text-white/50 mt-1">Latest user activities across the platform</p>
            </div>

            <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                    {activities.length > 0 ? (
                        activities.map((item, index) => (
                            <ActivityItem key={index} userName={item.userName} activity={item.activity} />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-white/40 text-sm">No recent activities</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
