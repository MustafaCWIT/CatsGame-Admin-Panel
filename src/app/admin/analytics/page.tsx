'use client';

import { useEffect, useState, Fragment } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { ChartContainer } from '@/components/admin/AnalyticsCharts';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import {
    Users, TrendingUp, Zap, Video, Calendar as CalendarIcon,
    Download, Filter, ChevronRight, RefreshCw, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B'];

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [dateRange, setDateRange] = useState<string>('30');

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            try {
                const response = await fetch(`/api/admin/analytics?days=${dateRange}`);
                if (!response.ok) throw new Error('Failed to fetch analytics');
                const analyticsData = await response.json();
                setData(analyticsData);
            } catch (err) {
                toast.error('Failed to load analytics data');
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [dateRange]);

    if (loading) return <AnalyticsSkeleton />;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Advanced Analytics</h1>
                    <p className="text-white/60 mt-1">Deep dive into user behavior and platform metrics</p>
                </div>

                <div className="flex items-center gap-2">
                    <Tabs value={dateRange} onValueChange={setDateRange} className="w-auto">
                        <TabsList className="bg-white/5 border border-white/10">
                            <TabsTrigger value="7">7D</TabsTrigger>
                            <TabsTrigger value="30">30D</TabsTrigger>
                            <TabsTrigger value="90">90D</TabsTrigger>
                            <TabsTrigger value="365">1Y</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button variant="outline" className="border-white/10 bg-white/5 text-white/70">
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Avg. Engagement"
                    value="84%"
                    description="Daily active users / MAU"
                    icon={TrendingUp}
                    variant="gradient"
                />
                <StatsCard
                    title="Retention Rate"
                    value="62%"
                    description="30-day user retention"
                    icon={Users}
                />
                <StatsCard
                    title="Avg. Session Time"
                    value="12.5m"
                    description="Time spent per session"
                    icon={Zap}
                />
                <StatsCard
                    title="Viral Coefficent"
                    value="1.2"
                    description="Avg. invites per user"
                    icon={Video}
                />
            </div>

            <Tabs defaultValue="engagement" className="space-y-6">
                <TabsList className="bg-transparent border-b border-white/10 rounded-none h-auto p-0 gap-6">
                    <TabsTrigger value="engagement" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 py-2 text-white/50 data-[state=active]:text-white">
                        User Engagement
                    </TabsTrigger>
                    <TabsTrigger value="monetization" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 py-2 text-white/50 data-[state=active]:text-white">
                        Progression & Economy
                    </TabsTrigger>
                    <TabsTrigger value="content" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-pink-500 rounded-none px-0 py-2 text-white/50 data-[state=active]:text-white">
                        Content & Video
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="engagement" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <ChartContainer title="Daily Active Users" className="lg:col-span-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.userGrowth}>
                                    <defs>
                                        <linearGradient id="engagementColor" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Area type="monotone" dataKey="count" stroke="#EC4899" fill="url(#engagementColor)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title="User Segments">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Active', value: 400 },
                                            { name: 'New', value: 300 },
                                            { name: 'Returning', value: 300 },
                                            { name: 'At Risk', value: 200 }
                                        ]}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {COLORS.map((color, index) => <Cell key={index} fill={color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {['Active', 'New', 'Returning', 'At Risk'].map((segment, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                        <span className="text-xs text-white/60">{segment}</span>
                                    </div>
                                ))}
                            </div>
                        </ChartContainer>
                    </div>

                    <ChartContainer title="Retention cohorts" description="Percentage of users returning after N weeks">
                        <div className="grid grid-cols-7 gap-1 mt-4">
                            {['Week', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6'].map(h => (
                                <div key={h} className="text-center text-[10px] text-white/40 font-bold">{h}</div>
                            ))}
                            {[...Array(5)].map((_, i) => (
                                <Fragment key={i}>
                                    <div className="text-center text-[10px] text-white/40 py-2">Jan {i + 1}</div>
                                    {[...Array(6)].map((_, j) => (
                                        <div
                                            key={j}
                                            className="rounded p-2 text-[10px] text-center font-bold"
                                            style={{
                                                backgroundColor: `rgba(236, 72, 153, ${0.8 - (j * 0.12)})`,
                                                color: j > 3 ? 'rgba(255,255,255,0.6)' : 'white'
                                            }}
                                        >
                                            {Math.floor(80 - (j * 12) - (Math.random() * 5))}%
                                        </div>
                                    ))}
                                </Fragment>
                            ))}
                        </div>
                    </ChartContainer>
                </TabsContent>

                <TabsContent value="monetization">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ChartContainer title="XP Velocity" description="Average XP gain per user per day">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.activityTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Line type="step" dataKey="count" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title="Economic Sink vs Source" description="XP generation vs Consumption (hypothetical)">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.userGrowth.slice(0, 7)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </TabsContent>

                <TabsContent value="content">
                    <ChartContainer title="Video Upload Frequency">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.videoTrends}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Area type="natural" dataKey="count" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 bg-white/5" />
                    <Skeleton className="h-5 w-96 bg-white/5" />
                </div>
                <Skeleton className="h-10 w-48 bg-white/5" />
            </div>
            <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
                ))}
            </div>
            <Skeleton className="h-[500px] rounded-2xl bg-white/5" />
        </div>
    );
}
