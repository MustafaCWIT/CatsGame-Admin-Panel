'use client';

import { useEffect, useState } from 'react';
import { GamePerformanceMetrics } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer } from '@/components/admin/AnalyticsCharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Gamepad2, Trophy, Clock, TrendingUp } from 'lucide-react';

export default function GameAnalyticsPage() {
    const [metrics, setMetrics] = useState<GamePerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState('7');

    useEffect(() => {
        fetchMetrics();
    }, [days]);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/activities/game-performance?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch metrics');
            const data = await response.json();
            setMetrics(data);
        } catch (error) {
            console.error('Error fetching game metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        return `${minutes}m`;
    };

    if (loading) {
        return <GameAnalyticsSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Game Analytics</h1>
                    <p className="text-white/60 mt-1">
                        Performance metrics and insights for game sessions
                    </p>
                </div>

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

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Average Score</h3>
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{metrics?.averageScore || 0}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Avg Session Time</h3>
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                        {metrics ? formatDuration(metrics.averageSessionTime) : '0s'}
                    </p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Total Games</h3>
                        <Gamepad2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{metrics?.totalGames.toLocaleString() || 0}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Completion Rate</h3>
                        <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{metrics?.completionRate || 0}%</p>
                </Card>
            </div>

            {/* Average Score by Level Chart */}
            {metrics && metrics.averageScoreByLevel.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Average Score by Level</h2>
                    <ChartContainer
                        title=""
                        description=""
                        className="h-[400px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.averageScoreByLevel}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="level"
                                    stroke="rgba(255,255,255,0.4)"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.4)"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                />
                                <Bar
                                    dataKey="avgScore"
                                    fill="hsl(330, 90%, 60%)"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </Card>
            )}

            {/* Level Statistics Table */}
            {metrics && metrics.averageScoreByLevel.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Level Statistics</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-white/60 text-sm font-medium p-3">Level</th>
                                    <th className="text-right text-white/60 text-sm font-medium p-3">Avg Score</th>
                                    <th className="text-right text-white/60 text-sm font-medium p-3">Games Played</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.averageScoreByLevel.map((level) => (
                                    <tr key={level.level} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-3 text-white font-medium">Level {level.level}</td>
                                        <td className="p-3 text-white/70 text-right">{level.avgScore.toLocaleString()}</td>
                                        <td className="p-3 text-white/70 text-right">{level.count.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

function GameAnalyticsSkeleton() {
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

