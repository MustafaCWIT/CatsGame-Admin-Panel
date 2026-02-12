'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { UserWithLevel, Activity, getXPProgress } from '@/types/database';
import { StatsCard } from '@/components/admin/StatsCard';
import { ChartContainer } from '@/components/admin/AnalyticsCharts';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    ChevronLeft,
    Pencil,
    Trash2,
    Mail,
    Phone,
    Calendar,
    Shield,
    Sparkles,
    Video,
    Activity as ActivityIcon,
    Clock,
    Play,
    ExternalLink,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [user, setUser] = useState<UserWithLevel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [videoUrls, setVideoUrls] = useState<{ original: string; signed: string }[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            try {
                const response = await fetch(`/api/admin/users/${id}`);
                if (!response.ok) throw new Error('User not found');
                const data = await response.json();
                setUser(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load user');
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [id]);

    // Fetch public URLs for videos (videos are now publicly accessible)
    useEffect(() => {
        async function fetchVideoUrls() {
            if (!user?.video_url) {
                setVideoUrls([]);
                return;
            }

            setLoadingVideos(true);
            try {
                const supabase = createClient();
                const parsedUrls = parseVideoUrls(user.video_url);
                
                const videoUrlPromises = parsedUrls.map(async (url) => {
                    // Check if it's already a full URL (http/https)
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return { original: url, signed: url };
                    }

                    // If it's a Supabase Storage path, get public URL
                    // Path format might be: userId/filename.mp4 or Videos/userId/filename.mp4
                    let storagePath = url;
                    
                    // Remove 'Videos/' prefix if present
                    if (storagePath.startsWith('Videos/')) {
                        storagePath = storagePath.replace('Videos/', '');
                    }

                    // Get public URL (videos are now publicly accessible)
                    const { data: publicData } = supabase.storage
                        .from('Videos')
                        .getPublicUrl(storagePath);

                    return { original: url, signed: publicData.publicUrl };
                });

                const resolvedUrls = await Promise.all(videoUrlPromises);
                setVideoUrls(resolvedUrls);
            } catch (err) {
                console.error('Error fetching video URLs:', err);
                toast.error('Failed to load video URLs');
            } finally {
                setLoadingVideos(false);
            }
        }

        if (user) {
            fetchVideoUrls();
        }
    }, [user?.video_url]);

    // Parse video URLs - handle single URL, JSON array, or comma-separated
    const parseVideoUrls = (videoUrl: string | null | undefined): string[] => {
        if (!videoUrl) return [];
        
        try {
            // Try parsing as JSON first
            const parsed = JSON.parse(videoUrl);
            if (Array.isArray(parsed)) {
                return parsed.filter((url: any) => typeof url === 'string' && url.trim() !== '');
            }
        } catch {
            // Not JSON, continue
        }
        
        // Check if it's comma-separated
        if (videoUrl.includes(',')) {
            return videoUrl.split(',').map(url => url.trim()).filter(url => url !== '');
        }
        
        // Single URL
        return [videoUrl.trim()].filter(url => url !== '');
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete user');

            toast.success('User deleted successfully');
            router.push('/admin/users');
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    if (loading) return <DetailsSkeleton />;
    if (error || !user) {
        return (
            <div className="text-center py-20">
                <p className="text-red-400 text-lg">{error || 'User not found'}</p>
                <Button variant="link" onClick={() => router.push('/admin/users')} className="text-white/60">
                    Back to Users
                </Button>
            </div>
        );
    }

    const progress = getXPProgress(user.total_xp);

    // Format XP progression chart data
    const xpHistory = user.activities
        ?.filter(a => a.text.toLowerCase().includes('xp'))
        .map(a => ({
            date: format(new Date(a.date), 'MMM d'),
            xp: parseInt(a.text.match(/\d+/)?.[0] || '0')
        })) || [];

    const handleVideoClick = (signedUrl: string) => {
        setSelectedVideo(signedUrl);
        setVideoDialogOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/admin/users')}
                        className="text-white/60 hover:text-white"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 border-2 border-pink-500/20">
                            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-violet-600 text-white text-xl">
                                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">{user.full_name}</h1>
                            <p className="text-white/40 font-mono text-sm">{user.id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/users/${id}/edit`)}
                        className="border-white/10 text-white/80 hover:bg-white/5"
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - User Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/70">
                                <Mail className="w-5 h-5 text-white/30" />
                                <div className="min-w-0">
                                    <p className="text-xs text-white/40">Email Address</p>
                                    <p className="truncate font-medium">{user.email || 'No email'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-white/70">
                                <Phone className="w-5 h-5 text-white/30" />
                                <div className="min-w-0">
                                    <p className="text-xs text-white/40">Phone Number</p>
                                    <p className="truncate font-medium">{user.phone || 'No phone'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-white/70">
                                <Clock className="w-5 h-5 text-white/30" />
                                <div className="min-w-0">
                                    <p className="text-xs text-white/40">Last Updated</p>
                                    <p className="truncate font-medium">
                                        {user.updated_at ? format(new Date(user.updated_at), 'PPPp') : 'Never'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-white/10" />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Level Progress</h3>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-violet-500/10 border border-pink-500/20">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-xs text-pink-400 font-bold uppercase tracking-wider">Level</span>
                                        <p className="text-3xl font-black text-white">{user.level}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-white/40 font-medium">Next Level</span>
                                        <p className="text-sm font-bold text-white/80">{Math.floor(progress.percentage)}%</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-pink-500 to-violet-500 transition-all duration-1000"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/40 mt-2 text-center italic">
                                    {progress.current} / {progress.required} XP to next level
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats and Analytics */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <StatsCard
                            title="Total XP"
                            value={user.total_xp.toLocaleString()}
                            icon={Sparkles}
                            variant="gradient"
                        />
                        <StatsCard
                            title="Videos Uploaded"
                            value={user.videos_count}
                            icon={Video}
                        />
                    </div>

                    <ChartContainer title="XP History" description="Recent XP gains from user activities">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={xpHistory.length > 0 ? xpHistory : [{ date: 'No Data', xp: 0 }]}>
                                <defs>
                                    <linearGradient id="xpColor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(330, 90%, 60%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(330, 90%, 60%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                />
                                <Area type="monotone" dataKey="xp" stroke="hsl(330, 90%, 60%)" strokeWidth={2} fill="url(#xpColor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* Videos Section */}
                    {loadingVideos ? (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4 rounded-full bg-white/10 animate-pulse" />
                                <p className="text-white/60 text-sm">Loading videos...</p>
                            </div>
                        </div>
                    ) : videoUrls.length > 0 ? (
                        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Uploaded Videos</h3>
                                <Badge variant="outline" className="border-white/10 text-white/40">
                                    {videoUrls.length} Video{videoUrls.length !== 1 ? 's' : ''}
                                </Badge>
                            </div>
                            <div className="p-6">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {videoUrls.map((video, index) => (
                                        <div
                                            key={index}
                                            className="group relative aspect-video rounded-lg overflow-hidden bg-black/20 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                            onClick={() => handleVideoClick(video.signed)}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500/20 to-violet-500/20">
                                                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                    <Play className="w-8 h-8 text-white" fill="white" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                                <p className="text-xs text-white/80 font-medium truncate">
                                                    Video {index + 1}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : user.video_url ? (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                            <p className="text-white/60 text-sm">No videos found or unable to load video URLs.</p>
                        </div>
                    ) : null}

                    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Full Activity History</h3>
                            <Badge variant="outline" className="border-white/10 text-white/40">
                                {user.activities?.length || 0} Actions
                            </Badge>
                        </div>
                        <ScrollArea className="h-[300px]">
                            <div className="p-4 space-y-2">
                                {user.activities && user.activities.length > 0 ? (
                                    user.activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((activity, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                                <ActivityIcon className="w-4 h-4 text-white/30" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white/80">{activity.text}</p>
                                                <p className="text-xs text-white/30">{format(new Date(activity.date), 'MMM d, yyyy · p')}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-white/30 text-sm">No activity records found</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </div>

            {/* Video Dialog */}
            <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
                <DialogContent className="max-w-4xl bg-black border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">Video Player</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Viewing uploaded video
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVideo && (
                        <div className="space-y-4">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                {selectedVideo ? (
                                    <video
                                        src={selectedVideo}
                                        controls
                                        className="w-full h-full"
                                        onError={(e) => {
                                            console.error('Video load error:', e);
                                            toast.error('Failed to load video. The video may be unavailable or the URL may be invalid.');
                                        }}
                                        onLoadStart={() => {
                                            // Video is starting to load
                                        }}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/60">
                                        <p>No video selected</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => window.open(selectedVideo, '_blank')}
                                    className="border-white/10 text-white/80 hover:bg-white/10"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open in New Tab
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setVideoDialogOpen(false)}
                                    className="text-white/60 hover:text-white"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DetailsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full bg-white/5" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 bg-white/5" />
                        <Skeleton className="h-4 w-32 bg-white/5" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 bg-white/5" />
                    <Skeleton className="h-10 w-24 bg-red-500/10" />
                </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <Skeleton className="h-[500px] rounded-2xl bg-white/5" />
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 rounded-2xl bg-white/5" />
                        <Skeleton className="h-32 rounded-2xl bg-white/5" />
                    </div>
                    <Skeleton className="h-[300px] rounded-2xl bg-white/5" />
                </div>
            </div>
        </div>
    );
}
