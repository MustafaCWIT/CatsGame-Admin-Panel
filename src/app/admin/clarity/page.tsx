'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Video, MousePointerClick, TrendingUp, Users, Clock } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ClarityStats {
    totalSessions: number;
    avgSessionDuration: number;
    totalPageViews: number;
    bounceRate: number;
    topPages: { path: string; views: number }[];
    recentSessions: { id: string; userId: string; duration: number; timestamp: string; userName: string }[];
}

export default function ClarityAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [clarityProjectId, setClarityProjectId] = useState<string | null>(null);
    const [stats, setStats] = useState<ClarityStats | null>(null);
    const [days, setDays] = useState('30');

    useEffect(() => {
        // Get Clarity project ID from environment
        const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || null;
        setClarityProjectId(projectId);
        fetchStats();
    }, [days]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/clarity/stats?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching Clarity stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const clarityDashboardUrl = clarityProjectId
        ? `https://clarity.microsoft.com/projects/${clarityProjectId}`
        : 'https://clarity.microsoft.com';

    if (loading) {
        return <ClaritySkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Clarity Analytics</h1>
                    <p className="text-white/60 mt-1">
                        Behavioral analytics and user insights for your Cats Game app
                    </p>
                </div>

                <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <a href={clarityDashboardUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Clarity Dashboard
                    </a>
                </Button>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
                <Select value={days} onValueChange={setDays}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Quick Stats */}
            {loading ? (
                <ClaritySkeleton />
            ) : stats ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Sessions"
                            value={stats?.totalSessions || 0}
                            icon={Users}
                            description="Last 30 days"
                        />
                        <StatCard
                            title="Avg Session Duration"
                            value={formatDuration(stats?.avgSessionDuration || 0)}
                            icon={Clock}
                            description="Per session"
                        />
                        <StatCard
                            title="Page Views"
                            value={stats?.totalPageViews || 0}
                            icon={MousePointerClick}
                            description="Total interactions"
                        />
                        <StatCard
                            title="Bounce Rate"
                            value={`${stats?.bounceRate || 0}%`}
                            icon={TrendingUp}
                            description="Single page sessions"
                        />
                    </div>

                    {/* Clarity Dashboard Embed */}
                    {clarityProjectId && (
                        <Card className="p-6 bg-white/5 border-white/10">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-2">Clarity Dashboard</h2>
                                    <p className="text-white/60 text-sm">
                                        View real-time analytics, session replays, and heatmaps
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="border-white/20 text-white hover:bg-white/10"
                                >
                                    <a href={clarityDashboardUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open Full Dashboard
                                    </a>
                                </Button>
                            </div>
                            <div className="aspect-video bg-black/20 rounded-lg border border-white/10 overflow-hidden">
                                <iframe
                                    src={`https://clarity.microsoft.com/projects/${clarityProjectId}`}
                                    className="w-full h-full"
                                    title="Clarity Dashboard"
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                />
                            </div>
                        </Card>
                    )}

                    {/* Top Pages */}
                    {stats?.topPages && stats.topPages.length > 0 && (
                        <Card className="p-6 bg-white/5 border-white/10">
                            <h2 className="text-xl font-semibold text-white mb-4">Top Pages</h2>
                            <div className="space-y-2">
                                {stats.topPages.map((page, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-white/40 text-sm font-mono w-8">
                                                #{index + 1}
                                            </span>
                                            <span className="text-white">{page.path}</span>
                                        </div>
                                        <span className="text-white/60 text-sm">
                                            {page.views.toLocaleString()} views
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Recent Sessions */}
                    {stats?.recentSessions && stats.recentSessions.length > 0 && (
                        <Card className="p-6 bg-white/5 border-white/10">
                            <h2 className="text-xl font-semibold text-white mb-4">Recent Sessions</h2>
                            <div className="space-y-2">
                                {stats.recentSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Video className="w-4 h-4 text-white/40" />
                                            <div>
                                                <p className="text-white text-sm">
                                                    {session.userName || `User: ${session.userId.slice(0, 8)}...`}
                                                </p>
                                                <p className="text-white/50 text-xs">
                                                    {new Date(session.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-white/60 text-sm">
                                                {formatDuration(session.duration)}
                                            </span>
                                            {clarityProjectId && (
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-400 hover:text-blue-300"
                                                >
                                                    <a
                                                        href={`https://clarity.microsoft.com/projects/${clarityProjectId}/recordings?userId=${session.userId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="w-3 h-3 mr-1" />
                                                        View Replay
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            ) : (
                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="text-center py-10">
                        <p className="text-white/40 text-sm">No analytics data available</p>
                        <p className="text-white/30 text-xs mt-2">
                            Make sure activities are being tracked in your game app
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
}) {
    return (
        <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">{title}</h3>
                <Icon className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            {description && (
                <p className="text-white/40 text-xs">{description}</p>
            )}
        </Card>
    );
}

function ClaritySkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-48 bg-white/10" />
                    <Skeleton className="h-5 w-96 mt-2 bg-white/10" />
                </div>
                <Skeleton className="h-10 w-40 bg-white/10" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl bg-white/10" />
                ))}
            </div>
            <Skeleton className="h-96 rounded-xl bg-white/10" />
        </div>
    );
}

function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}

