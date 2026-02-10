'use client';

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function ChartContainer({ title, description, children, className }: ChartContainerProps) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-white/5 border border-white/10 p-6 transition-all duration-300 hover:border-white/20',
                className
            )}
        >
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {description && (
                    <p className="text-sm text-white/50 mt-1">{description}</p>
                )}
            </div>
            <div className="h-[300px]">{children}</div>
        </div>
    );
}

const COLORS = [
    'hsl(330, 90%, 60%)', // Pink
    'hsl(270, 90%, 60%)', // Purple
    'hsl(200, 90%, 60%)', // Blue
    'hsl(160, 90%, 50%)', // Teal
    'hsl(45, 90%, 60%)',  // Yellow
];

interface UserGrowthChartProps {
    data: { date: string; count: number }[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
                <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(330, 90%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(330, 90%, 60%)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                    dataKey="date"
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
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(330, 90%, 60%)"
                    strokeWidth={2}
                    fill="url(#colorUsers)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

interface XPDistributionChartProps {
    data: { range: string; count: number }[];
}

export function XPDistributionChart({ data }: XPDistributionChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                    dataKey="range"
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
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white',
                    }}
                />
                <Bar
                    dataKey="count"
                    fill="hsl(270, 90%, 60%)"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

interface TopUsersChartProps {
    data: { name: string; xp: number }[];
}

export function TopUsersChart({ data }: TopUsersChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={12}
                    tickLine={false}
                />
                <YAxis
                    dataKey="name"
                    type="category"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={12}
                    tickLine={false}
                    width={80}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white',
                    }}
                />
                <Bar dataKey="xp" fill="hsl(330, 90%, 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

interface VideoTrendsChartProps {
    data: { date: string; count: number }[];
}

export function VideoTrendsChart({ data }: VideoTrendsChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                    dataKey="date"
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
                <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(200, 90%, 60%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(200, 90%, 60%)', strokeWidth: 2 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

interface ActivityPieChartProps {
    data: { name: string; value: number }[];
}

export function ActivityPieChart({ data }: ActivityPieChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: 'white',
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
