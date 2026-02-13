'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardStats, Activity } from '@/types/database';
import { StatsCard } from '@/components/admin/StatsCard';
import {
    ChartContainer,
    UserGrowthChart,
    XPDistributionChart,
    TopUsersChart,
    GameTimePerUserChart,
} from '@/components/admin/AnalyticsCharts';
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed';
import { RealTimeActivityFeed } from '@/components/admin/RealTimeActivityFeed';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Clock,
    Video,
} from 'lucide-react';

interface AnalyticsData {
    userGrowth: { date: string; count: number }[];
    xpDistribution: { range: string; count: number }[];
    topUsers: { name: string; xp: number }[];
    topUsersByGameTime: { name: string; gameTime: number }[];
    videoTrends: { date: string; count: number }[];
    activityTimeline: { date: string; count: number }[];
    recentActivities: { userName: string; activity: Activity }[];
}

interface ActivityMetrics {
    totalActivities: number;
    totalUsers: number;
    activeSessionsToday: number;
    gameSessions: number;
    videoUploads: number;
    conversionRate: number;
    averageGameScore: number;
    averageSessionDuration: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch stats
                const statsRes = await fetch('/api/admin/stats');
                if (!statsRes.ok) throw new Error('Failed to fetch stats');
                const statsData = await statsRes.json();
                setStats(statsData);

                // Fetch analytics
                const analyticsRes = await fetch('/api/admin/analytics?days=30');
                if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
                const analyticsData = await analyticsRes.json();
                setAnalytics(analyticsData);

                // Fetch activity metrics
                const metricsRes = await fetch('/api/admin/activities/metrics');
                if (metricsRes.ok) {
                    const metricsData = await metricsRes.json();
                    setActivityMetrics(metricsData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-2">Error loading dashboard</p>
                    <p className="text-white/50">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                <p className="text-white/60 mt-1">
                    Welcome back! Here&apos;s an overview of your Tap to Purr statistics.
                </p>
            </div>

            {/* Stats Grid */}
            {/* Stats Grid - All in one row */}
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                />
                <StatsCard
                    title="Total Videos"
                    value={stats?.totalVideos || 0}
                    icon={Video}
                />
                <StatsCard
                    title="Total Game Time"
                    value={formatGameTime(stats?.totalGameTime || 0)}
                    icon={Clock}
                    description="All users combined"
                />
                {activityMetrics && (
                    <StatsCard
                        title="Video Uploads"
                        value={activityMetrics.videoUploads.toLocaleString()}
                        icon={Video}
                    />
                )}
            </div>



            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ChartContainer
                    title="User Growth"
                    description="New user registrations over the last 30 days"
                >
                    <UserGrowthChart data={analytics?.userGrowth || []} />
                </ChartContainer>

                <ChartContainer
                    title="XP Distribution"
                    description="Distribution of users by XP range"
                >
                    <XPDistributionChart data={analytics?.xpDistribution || []} />
                </ChartContainer>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <ChartContainer
                    title="Top Users by XP"
                    description="Leaderboard of top 10 users"
                >
                    <TopUsersChart data={analytics?.topUsers || []} />
                </ChartContainer>
                <ChartContainer
                    title="Game Time per User"
                    description="Top 10 users by game time spent"
                >
                    <GameTimePerUserChart data={analytics?.topUsersByGameTime || []} />
                </ChartContainer>
            </div>

            {/* Recent Activity */}
            <RecentActivityFeed activities={analytics?.recentActivities || []} />

            {/* Real-time Activity Feed */}
            <RealTimeActivityFeed maxItems={20} refreshInterval={5000} />
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-9 w-48 bg-white/10" />
                <Skeleton className="h-5 w-96 mt-2 bg-white/10" />
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl bg-white/10" />
                ))}
            </div>



            <div className="grid gap-6 lg:grid-cols-1">
                <Skeleton className="h-[380px] rounded-2xl bg-white/10" />
            </div>
        </div>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatGameTime(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${hours}h`;
    }
    
    if (minutes > 0) {
        if (remainingSeconds > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${minutes}m`;
    }
    
    return `${remainingSeconds}s`;
}
