'use client';

import { useEffect, useState } from 'react';
import { UploadFunnelMetrics } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer } from '@/components/admin/AnalyticsCharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Upload, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadAnalyticsPage() {
    const [funnel, setFunnel] = useState<UploadFunnelMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState('30');

    useEffect(() => {
        fetchFunnel();
    }, [days]);

    const fetchFunnel = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/activities/upload-funnel?days=${days}`);
            if (!response.ok) throw new Error('Failed to fetch funnel');
            const data = await response.json();
            setFunnel(data);
        } catch (error) {
            console.error('Error fetching upload funnel:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <UploadAnalyticsSkeleton />;
    }

    const funnelData = funnel ? [
        { step: 'Clicked Upload', value: funnel.clickedUpload, label: 'Users who clicked upload' },
        { step: 'Selected Video', value: funnel.selectedVideo, label: 'Users who selected video' },
        { step: 'Selected Receipt', value: funnel.selectedReceipt, label: 'Users who selected receipt' },
        { step: 'Filled Store Name', value: funnel.filledStoreName, label: 'Users who filled store name' },
        { step: 'Submitted', value: funnel.submitted, label: 'Users who submitted' },
        { step: 'Completed', value: funnel.completed, label: 'Users who completed upload' },
    ] : [];

    const calculateDropoff = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return Math.round(((previous - current) / previous) * 100);
    };

    const dropoffRates = funnel ? [
        { step: 'Clicked → Selected Video', rate: calculateDropoff(funnel.selectedVideo, funnel.clickedUpload) },
        { step: 'Selected Video → Selected Receipt', rate: calculateDropoff(funnel.selectedReceipt, funnel.selectedVideo) },
        { step: 'Selected Receipt → Filled Store', rate: calculateDropoff(funnel.filledStoreName, funnel.selectedReceipt) },
        { step: 'Filled Store → Submitted', rate: calculateDropoff(funnel.submitted, funnel.filledStoreName) },
        { step: 'Submitted → Completed', rate: calculateDropoff(funnel.completed, funnel.submitted) },
    ] : [];

    const overallConversionRate = funnel && funnel.clickedUpload > 0
        ? Math.round((funnel.completed / funnel.clickedUpload) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Upload Analytics</h1>
                    <p className="text-white/60 mt-1">
                        Upload funnel analysis and conversion metrics
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
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Started Upload</h3>
                        <Upload className="w-5 h-5 text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{funnel?.clickedUpload.toLocaleString() || 0}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Completed Upload</h3>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{funnel?.completed.toLocaleString() || 0}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white/60 text-sm font-medium">Conversion Rate</h3>
                        <TrendingDown className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">{overallConversionRate}%</p>
                </Card>
            </div>

            {/* Upload Funnel Chart */}
            {funnelData.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Upload Funnel</h2>
                    <ChartContainer
                        title=""
                        description=""
                        className="h-[400px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    type="number"
                                    stroke="rgba(255,255,255,0.4)"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="step"
                                    type="category"
                                    stroke="rgba(255,255,255,0.4)"
                                    fontSize={12}
                                    tickLine={false}
                                    width={150}
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
                                    dataKey="value"
                                    fill="hsl(330, 90%, 60%)"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </Card>
            )}

            {/* Drop-off Analysis */}
            {dropoffRates.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Drop-off Analysis</h2>
                    <div className="space-y-3">
                        {dropoffRates.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className={`w-4 h-4 ${item.rate > 50 ? 'text-red-400' : item.rate > 30 ? 'text-yellow-400' : 'text-green-400'}`} />
                                    <span className="text-white text-sm">{item.step}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 bg-white/10 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${item.rate > 50 ? 'bg-red-500' : item.rate > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(item.rate, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-medium w-12 text-right ${item.rate > 50 ? 'text-red-400' : item.rate > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {item.rate}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Funnel Steps Detail */}
            {funnelData.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-4">Funnel Steps</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-white/60 text-sm font-medium p-3">Step</th>
                                    <th className="text-right text-white/60 text-sm font-medium p-3">Users</th>
                                    <th className="text-right text-white/60 text-sm font-medium p-3">% of Started</th>
                                </tr>
                            </thead>
                            <tbody>
                                {funnelData.map((step, index) => {
                                    const percentage = funnel && funnel.clickedUpload > 0
                                        ? Math.round((step.value / funnel.clickedUpload) * 100)
                                        : 0;
                                    return (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-3 text-white">{step.step}</td>
                                            <td className="p-3 text-white/70 text-right">{step.value.toLocaleString()}</td>
                                            <td className="p-3 text-white/70 text-right">{percentage}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}

function UploadAnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-48 bg-white/10" />
                    <Skeleton className="h-5 w-96 mt-2 bg-white/10" />
                </div>
                <Skeleton className="h-10 w-40 bg-white/10" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl bg-white/10" />
                ))}
            </div>
            <Skeleton className="h-96 rounded-xl bg-white/10" />
        </div>
    );
}

