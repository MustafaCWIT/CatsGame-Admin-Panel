'use client';

import { useEffect, useState, useRef } from 'react';
import { UserActivity } from '@/types/database';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Activity, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RealTimeActivityFeedProps {
    maxItems?: number;
    refreshInterval?: number;
    filterActivityType?: string;
}

export function RealTimeActivityFeed({
    maxItems = 20,
    refreshInterval = 5000,
    filterActivityType,
}: RealTimeActivityFeedProps) {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchRecentActivities = async () => {
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: maxItems.toString(),
            });

            if (filterActivityType) {
                params.append('activityType', filterActivityType);
            }

            const response = await fetch(`/api/admin/activities?${params}`);
            if (!response.ok) return;

            const data = await response.json();
            setActivities(data.data || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecentActivities();

        // Set up polling
        intervalRef.current = setInterval(() => {
            fetchRecentActivities();
        }, refreshInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [maxItems, filterActivityType, refreshInterval]);

    const getActivityColor = (type: string) => {
        if (type.startsWith('game_')) return 'bg-purple-500';
        if (type.startsWith('upload_')) return 'bg-orange-500';
        if (type.startsWith('user_') || type === 'session_start') return 'bg-blue-500';
        if (type.includes('error') || type.includes('failed')) return 'bg-red-500';
        if (type.includes('screen-')) return 'bg-cyan-500';
        return 'bg-slate-500';
    };

    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    const getClarityLink = (userId: string) => {
        if (!clarityProjectId) return null;
        return `https://clarity.microsoft.com/projects/${clarityProjectId}/recordings?userId=${userId}`;
    };

    return (
        <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-white/60" />
                    <h2 className="text-xl font-semibold text-white">Real-time Activity Feed</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchRecentActivities}
                    className="text-white/60 hover:text-white"
                >
                    Refresh
                </Button>
            </div>

            <ScrollArea className="h-[400px]">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-white/40 text-sm">No recent activities</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <div className={`w-2 h-2 rounded-full mt-2 ${getActivityColor(activity.activity_type)}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge
                                            className={`${getActivityColor(activity.activity_type)} text-white border-0 text-xs`}
                                        >
                                            {activity.activity_type.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-white/40 text-xs">
                                            {format(new Date(activity.created_at), 'HH:mm:ss')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/users/${activity.user_id}`}
                                            className="text-white/70 hover:text-blue-400 text-sm transition-colors"
                                        >
                                            {activity.user_phone || 'Unknown User'}
                                        </Link>
                                        {activity.activity_details && (
                                            <span className="text-white/40 text-xs truncate">
                                                {JSON.stringify(activity.activity_details).substring(0, 50)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {getClarityLink(activity.user_id) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="flex-shrink-0"
                                    >
                                        <a
                                            href={getClarityLink(activity.user_id)!}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
}

