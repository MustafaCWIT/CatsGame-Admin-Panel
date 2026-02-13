'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ExternalLink,
    Video,
    MousePointerClick,
    TrendingUp,
    Users,
    Clock,
    MousePointer,
    AlertTriangle,
    ArrowDownUp,
    Undo2,
    Globe,
    Monitor,
    Smartphone,
    RefreshCw,
    Timer,
} from 'lucide-react';
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

interface ClarityMetricInfo {
    [key: string]: string | number | null | undefined;
}

interface ClarityMetric {
    metricName: string;
    information: ClarityMetricInfo[];
}

export default function ClarityAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [clarityProjectId] = useState(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || null);
    const [stats, setStats] = useState<ClarityStats | null>(null);
    const [days, setDays] = useState('30');

    // Live insights state
    const [liveInsights, setLiveInsights] = useState<ClarityMetric[] | null>(null);
    const [liveLoading, setLiveLoading] = useState(true);
    const [liveError, setLiveError] = useState<string | null>(null);
    const [liveDays, setLiveDays] = useState('3');

    useEffect(() => {
        fetchStats();
    }, [days]);

    useEffect(() => {
        fetchLiveInsights();
    }, [liveDays]);

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

    const fetchLiveInsights = async () => {
        setLiveLoading(true);
        setLiveError(null);
        try {
            const response = await fetch(`/api/admin/clarity/live-insights?numOfDays=${liveDays}`);
            if (response.status === 503) {
                setLiveError('not_configured');
                return;
            }
            if (response.status === 429) {
                setLiveError('rate_limited');
                return;
            }
            if (!response.ok) {
                const data = await response.json();
                setLiveError(data.error || 'Failed to fetch live insights');
                return;
            }
            const data = await response.json();
            setLiveInsights(data);
        } catch (error) {
            setLiveError('Failed to fetch live insights');
        } finally {
            setLiveLoading(false);
        }
    };

    const clarityDashboardUrl = clarityProjectId
        ? `https://clarity.microsoft.com/projects/${clarityProjectId}`
        : 'https://clarity.microsoft.com';

    const clarityRecordingsUrl = clarityProjectId
        ? `https://clarity.microsoft.com/projects/${clarityProjectId}/recordings`
        : null;

    const clarityHeatmapsUrl = clarityProjectId
        ? `https://clarity.microsoft.com/projects/${clarityProjectId}/heatmaps`
        : null;

    // Helper to find a metric by name from the API response
    const getMetric = (name: string): ClarityMetric | null => {
        if (!liveInsights) return null;
        return liveInsights.find(m => m.metricName === name) || null;
    };

    const getMetricInfo = (name: string): ClarityMetricInfo | null => {
        const metric = getMetric(name);
        return metric?.information?.[0] || null;
    };

    // Extract actual API metrics (matching real API field names)
    const traffic = getMetricInfo('Traffic');
    const engagement = getMetricInfo('EngagementTime');
    const scrollDepth = getMetricInfo('ScrollDepth');
    const deadClicks = getMetricInfo('DeadClickCount');
    const rageClicks = getMetricInfo('RageClickCount');
    const excessiveScrolls = getMetricInfo('ExcessiveScroll');
    const quickbacks = getMetricInfo('QuickbackClick');
    const scriptErrors = getMetricInfo('ScriptErrorCount');

    // Breakdowns come as separate metrics in the base response
    const deviceBreakdown = getMetric('Device')?.information || [];
    const browserBreakdown = getMetric('Browser')?.information || [];
    const countryBreakdown = getMetric('Country')?.information || [];
    const popularPages = getMetric('PopularPages')?.information || [];

    // Format active time from seconds
    const activeTimeSeconds = Number(engagement?.activeTime || 0);
    const totalTimeSeconds = Number(engagement?.totalTime || 0);

    const timeRangeLabel = liveDays === '1' ? '24 hours' : liveDays === '2' ? '48 hours' : '72 hours';

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

                <div className="flex gap-2">
                    {clarityRecordingsUrl && (
                        <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                            <a href={clarityRecordingsUrl} target="_blank" rel="noopener noreferrer">
                                <Video className="w-4 h-4 mr-2" />
                                Recordings
                            </a>
                        </Button>
                    )}
                    {clarityHeatmapsUrl && (
                        <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                            <a href={clarityHeatmapsUrl} target="_blank" rel="noopener noreferrer">
                                <MousePointer className="w-4 h-4 mr-2" />
                                Heatmaps
                            </a>
                        </Button>
                    )}
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <a href={clarityDashboardUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Full Dashboard
                        </a>
                    </Button>
                </div>
            </div>

            {/* Live Insights Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Live Insights from Clarity</h2>
                    <div className="flex items-center gap-2">
                        <Select value={liveDays} onValueChange={setLiveDays}>
                            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Last 24 hours</SelectItem>
                                <SelectItem value="2">Last 48 hours</SelectItem>
                                <SelectItem value="3">Last 72 hours</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchLiveInsights}
                            disabled={liveLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${liveLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {liveError === 'not_configured' ? (
                    <Card className="p-6 bg-white/5 border-white/10">
                        <div className="text-center py-6">
                            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                            <h3 className="text-white font-medium mb-2">Clarity API Token Not Configured</h3>
                            <p className="text-white/50 text-sm max-w-md mx-auto mb-4">
                                To see live analytics from Microsoft Clarity, add your API token to <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env.local</code>
                            </p>
                            <div className="bg-white/5 rounded-lg p-4 max-w-lg mx-auto text-left">
                                <p className="text-white/60 text-xs mb-2">Steps:</p>
                                <ol className="text-white/50 text-xs space-y-1 list-decimal list-inside">
                                    <li>Go to your Clarity project settings</li>
                                    <li>Navigate to Data Export</li>
                                    <li>Click &quot;Generate new API token&quot;</li>
                                    <li>Add <code className="bg-white/10 px-1 rounded">CLARITY_API_TOKEN=your_token</code> to .env.local</li>
                                    <li>Restart the dev server</li>
                                </ol>
                            </div>
                        </div>
                    </Card>
                ) : liveError === 'rate_limited' ? (
                    <Card className="p-6 bg-white/5 border-white/10">
                        <div className="text-center py-6">
                            <Clock className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                            <h3 className="text-white font-medium mb-2">API Limit Reached</h3>
                            <p className="text-white/50 text-sm">
                                Clarity allows 10 API requests per day. Try again tomorrow.
                            </p>
                        </div>
                    </Card>
                ) : liveError ? (
                    <Card className="p-6 bg-white/5 border-white/10">
                        <div className="text-center py-6">
                            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <h3 className="text-white font-medium mb-2">Error Loading Live Insights</h3>
                            <p className="text-white/50 text-sm">{liveError}</p>
                        </div>
                    </Card>
                ) : liveLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl bg-white/10" />
                        ))}
                    </div>
                ) : liveInsights ? (
                    <>
                        {/* Traffic & Engagement Metrics */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Sessions"
                                value={Number(traffic?.totalSessionCount || 0).toLocaleString()}
                                icon={Users}
                                description={`Last ${timeRangeLabel}`}
                            />
                            <StatCard
                                title="Unique Users"
                                value={Number(traffic?.distinctUserCount || 0).toLocaleString()}
                                icon={Globe}
                                description="Distinct visitors"
                            />
                            <StatCard
                                title="Pages / Session"
                                value={Number(traffic?.pagesPerSessionPercentage || 0).toFixed(1)}
                                icon={MousePointerClick}
                                description="Average pages viewed"
                            />
                            <StatCard
                                title="Scroll Depth"
                                value={`${scrollDepth?.averageScrollDepth || 0}%`}
                                icon={ArrowDownUp}
                                description="Average scroll depth"
                            />
                            <StatCard
                                title="Active Time"
                                value={formatDuration(activeTimeSeconds)}
                                icon={Timer}
                                description={`${formatDuration(totalTimeSeconds)} total time`}
                            />
                            <StatCard
                                title="Dead Clicks"
                                value={`${deadClicks?.sessionsWithMetricPercentage || 0}%`}
                                icon={MousePointerClick}
                                description={`${deadClicks?.subTotal || 0} clicks in ${deadClicks?.sessionsCount || 0} sessions`}
                                variant={Number(deadClicks?.sessionsWithMetricPercentage || 0) > 0 ? 'warning' : undefined}
                            />
                            <StatCard
                                title="Rage Clicks"
                                value={`${rageClicks?.sessionsWithMetricPercentage || 0}%`}
                                icon={MousePointer}
                                description={`${rageClicks?.subTotal || 0} clicks in ${rageClicks?.sessionsCount || 0} sessions`}
                                variant={Number(rageClicks?.sessionsWithMetricPercentage || 0) > 0 ? 'warning' : undefined}
                            />
                            <StatCard
                                title="Quickbacks"
                                value={`${quickbacks?.sessionsWithMetricPercentage || 0}%`}
                                icon={Undo2}
                                description="Quick navigation backs"
                            />
                            <StatCard
                                title="Excessive Scrolls"
                                value={`${excessiveScrolls?.sessionsWithMetricPercentage || 0}%`}
                                icon={ArrowDownUp}
                                description="Unusually long scrolling"
                            />
                            <StatCard
                                title="Script Errors"
                                value={`${scriptErrors?.sessionsWithMetricPercentage || 0}%`}
                                icon={AlertTriangle}
                                description={`${scriptErrors?.subTotal || 0} errors detected`}
                                variant={Number(scriptErrors?.sessionsWithMetricPercentage || 0) > 0 ? 'danger' : undefined}
                            />
                        </div>

                        {/* Breakdowns & Popular Pages */}
                        <div className="grid gap-6 lg:grid-cols-3">
                            <BreakdownCard
                                title="By Device"
                                icon={<Smartphone className="w-4 h-4" />}
                                data={deviceBreakdown}
                            />
                            <BreakdownCard
                                title="By Browser"
                                icon={<Monitor className="w-4 h-4" />}
                                data={browserBreakdown}
                            />
                            <BreakdownCard
                                title="By Country"
                                icon={<Globe className="w-4 h-4" />}
                                data={countryBreakdown}
                            />
                        </div>

                        {/* Popular Pages from Clarity */}
                        {popularPages.length > 0 && (
                            <Card className="p-6 bg-white/5 border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Popular Pages (Clarity)</h3>
                                <div className="space-y-2">
                                    {popularPages.map((page, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/40 text-sm font-mono w-8">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-white text-sm truncate">{String(page.url)}</span>
                                            </div>
                                            <span className="text-white/60 text-sm whitespace-nowrap ml-4">
                                                {Number(page.visitsCount || 0).toLocaleString()} visits
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </>
                ) : null}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Local Stats Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">App Activity Stats</h2>
                        <p className="text-white/50 text-sm mt-1">From your activity tracking data</p>
                    </div>
                    <Select value={days} onValueChange={setDays}>
                        <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl bg-white/10" />
                        ))}
                    </div>
                ) : stats ? (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Total Sessions"
                                value={stats.totalSessions}
                                icon={Users}
                                description={`Last ${days} days`}
                            />
                            <StatCard
                                title="Avg Session Duration"
                                value={formatDuration(stats.avgSessionDuration)}
                                icon={Clock}
                                description="Per session"
                            />
                            <StatCard
                                title="Page Views"
                                value={stats.totalPageViews}
                                icon={MousePointerClick}
                                description="Total interactions"
                            />
                            <StatCard
                                title="Bounce Rate"
                                value={`${stats.bounceRate}%`}
                                icon={TrendingUp}
                                description="Single page sessions"
                            />
                        </div>

                        {/* Top Pages */}
                        {stats.topPages && stats.topPages.length > 0 && (
                            <Card className="p-6 bg-white/5 border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
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
                        {stats.recentSessions && stats.recentSessions.length > 0 && (
                            <Card className="p-6 bg-white/5 border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
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
                            <p className="text-white/40 text-sm">No activity data available</p>
                            <p className="text-white/30 text-xs mt-2">
                                Make sure activities are being tracked in your game app
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    description,
    variant,
}: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    variant?: 'warning' | 'danger';
}) {
    const borderColor = variant === 'danger'
        ? 'border-red-500/30'
        : variant === 'warning'
            ? 'border-yellow-500/20'
            : 'border-white/10';

    return (
        <Card className={`p-6 bg-white/5 ${borderColor}`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-sm font-medium">{title}</h3>
                <Icon className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-yellow-400' : 'text-white/40'}`} />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {description && (
                <p className="text-white/40 text-xs">{description}</p>
            )}
        </Card>
    );
}

function BreakdownCard({
    title,
    icon,
    data,
}: {
    title: string;
    icon: React.ReactNode;
    data: ClarityMetricInfo[];
}) {
    // Data comes as: [{ name: "Tablet", sessionsCount: "4" }, ...]
    const items = data
        .filter(item => item.name)
        .map(item => ({
            name: String(item.name),
            sessions: Number(item.sessionsCount || 0),
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5);

    const total = items.reduce((sum, item) => sum + item.sessions, 0);

    if (items.length === 0) return null;

    return (
        <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-white/40">{icon}</span>
                <h3 className="text-white font-medium">{title}</h3>
            </div>
            <div className="space-y-3">
                {items.map(({ name, sessions }) => {
                    const percentage = total > 0 ? (sessions / total) * 100 : 0;
                    return (
                        <div key={name}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-white/80">{name}</span>
                                <span className="text-white/50">{sessions.toLocaleString()} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
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
