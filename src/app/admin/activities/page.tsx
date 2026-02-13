'use client';

import { useEffect, useState } from 'react';
import { UserActivity, ActivityMetrics, PaginatedResponse } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Download,
    RefreshCw,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Eye,
    ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

const ACTIVITY_TYPES = [
    'user_signup',
    'user_login',
    'user_logout',
    'session_start',
    'game_started',
    'game_ended',
    'game_restarted',
    'game_paused',
    'game_resumed',
    'upload_button_clicked',
    'upload_video_file_selected',
    'upload_receipt_file_selected',
    'upload_submit_button_clicked',
    'video_uploaded',
    'play_button_clicked',
    'end_game_button_clicked',
];

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);

    // Filters
    const [activityType, setActivityType] = useState<string>('');
    const [userId, setUserId] = useState<string>('');
    const [search, setSearchInput] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    
    // Set default date range to current month
    const getCurrentMonthDates = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Format as YYYY-MM-DD for date input
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        return {
            start: formatDate(firstDay),
            end: formatDate(lastDay),
        };
    };
    
    const defaultDates = getCurrentMonthDates();
    const [startDate, setStartDate] = useState(defaultDates.start);
    const [endDate, setEndDate] = useState(defaultDates.end);

    // Selected activity for details
    const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchDebounced(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    // Fetch activities
    useEffect(() => {
        fetchActivities();
    }, [page, limit, activityType, userId, searchDebounced, startDate, endDate]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (activityType) params.append('activityType', activityType);
            if (userId) params.append('userId', userId);
            if (searchDebounced) params.append('search', searchDebounced);
            
            // Format dates properly - startDate should be start of day, endDate should be end of day
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                params.append('startDate', start.toISOString());
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.append('endDate', end.toISOString());
            }

            const response = await fetch(`/api/admin/activities?${params}`);
            if (!response.ok) throw new Error('Failed to fetch activities');

            const data: PaginatedResponse<UserActivity> = await response.json();
            setActivities(data.data);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams({
                page: '1',
                limit: '10000',
            });

            if (activityType) params.append('activityType', activityType);
            if (userId) params.append('userId', userId);
            if (searchDebounced) params.append('search', searchDebounced);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`/api/admin/activities?${params}`);
            if (!response.ok) throw new Error('Failed to fetch activities');

            const data: PaginatedResponse<UserActivity> = await response.json();

            // Convert to CSV
            const headers = ['Timestamp', 'User Phone', 'Activity Type', 'Details'];
            const rows = data.data.map(activity => [
                activity.created_at,
                (activity as any).user_phone || '',
                activity.activity_type,
                JSON.stringify(activity.activity_details || {}),
            ]);

            const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activities-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success('Export completed');
        } catch (error) {
            toast.error('Failed to export activities');
        }
    };

    const getActivityColor = (type: string) => {
        if (type.startsWith('game_')) return 'bg-purple-500';
        if (type.startsWith('upload_')) return 'bg-orange-500';
        if (type.startsWith('user_') || type === 'session_start') return 'bg-blue-500';
        if (type.includes('error') || type.includes('failed')) return 'bg-red-500';
        if (type.includes('screen-')) return 'bg-cyan-500';
        return 'bg-slate-500';
    };

    const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    const getClarityLink = (activityDetails: Record<string, unknown> | null) => {
        if (!clarityProjectId) return null;
        const screen = activityDetails?.screen as string | undefined;
        if (!screen) return null;
        return `https://clarity.microsoft.com/projects/view/${clarityProjectId}/dashboard?date=Last%203%20days&smartEvents=${encodeURIComponent(`screen-${screen}`)}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Activity Log</h1>
                    <p className="text-white/60 mt-1">
                        View and analyze all user activities ({total.toLocaleString()} total)
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button variant="ghost" size="icon" onClick={fetchActivities}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4 bg-white/5 border-white/10">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search activities..."
                            value={search}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <Select value={activityType || 'all'} onValueChange={(value) => setActivityType(value === 'all' ? '' : value)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="All Activity Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Activity Types</SelectItem>
                            {ACTIVITY_TYPES.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type.replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        placeholder="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                    />

                    <Input
                        type="date"
                        placeholder="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
            </Card>

            {/* Activities Table */}
            <Card className="p-0 bg-white/5 border-white/10 overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full bg-white/10" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10">
                                        <TableHead className="text-white/60">Timestamp</TableHead>
                                        <TableHead className="text-white/60">Phone</TableHead>
                                        <TableHead className="text-white/60">Activity Type</TableHead>
                                        <TableHead className="text-white/60">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-white/40">
                                                No activities found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        activities.map((activity) => (
                                            <TableRow
                                                key={activity.id}
                                                className="border-white/10 hover:bg-white/5"
                                            >
                                                <TableCell className="text-white/70 text-sm">
                                                    {format(new Date(activity.created_at), 'MMM d, yyyy HH:mm:ss')}
                                                </TableCell>
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/users/${activity.user_id}`}
                                                        className="text-white hover:text-blue-400 transition-colors"
                                                    >
                                                        {(activity as any).user_phone || 'Unknown'}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`${getActivityColor(activity.activity_type)} text-white border-0`}
                                                    >
                                                        {activity.activity_type.replace(/_/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setSelectedActivity(activity);
                                                            setDetailsOpen(true);
                                                        }}
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between p-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                                <span>Rows per page:</span>
                                <Select
                                    value={limit.toString()}
                                    onValueChange={(value) => {
                                        setLimit(parseInt(value));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-20 h-8 bg-white/5 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <div className="flex gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={page <= 1}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Activity Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={(open) => {
                setDetailsOpen(open);
                if (!open) {
                    // Clear selected activity when dialog closes
                    setSelectedActivity(null);
                }
            }}>
                <DialogContent className="max-w-2xl bg-black border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Activity Details</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Full details for this activity
                        </DialogDescription>
                    </DialogHeader>
                    {selectedActivity ? (
                        <ScrollArea className="max-h-[500px]">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-white font-medium mb-2">Basic Info</h4>
                                    <div className="bg-white/5 p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Type:</span>
                                            <Badge className={getActivityColor(selectedActivity.activity_type)}>
                                                {selectedActivity.activity_type}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Timestamp:</span>
                                            <span className="text-white">
                                                {format(new Date(selectedActivity.created_at), 'PPpp')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-white font-medium mb-2">User Info</h4>
                                    <div className="bg-white/5 p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Phone:</span>
                                            <span className="text-white">{(selectedActivity as any).user_phone || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-white/60">Total XP:</span>
                                            <span className="text-white">{selectedActivity.user_total_xp || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-white font-medium mb-2">Activity Details (JSON)</h4>
                                    <pre className="bg-white/5 p-3 rounded-lg text-xs text-white overflow-x-auto">
                                        {JSON.stringify(selectedActivity.activity_details, null, 2)}
                                    </pre>
                                </div>

                                {getClarityLink(selectedActivity.activity_details) && (
                                    <div>
                                        <Button asChild className="w-full">
                                            <a
                                                href={getClarityLink(selectedActivity.activity_details)!}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                View Clarity Session Replay
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="p-4 text-center text-white/60">
                            <p>Loading activity details...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

