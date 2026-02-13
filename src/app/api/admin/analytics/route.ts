import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { subDays, format, eachDayOfInterval } from 'date-fns';

/** Safely parse a date string; returns null on invalid input */
function safeParseDate(dateStr: unknown): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        return d;
    } catch {
        return null;
    }
}

/** Safely format a date to 'yyyy-MM-dd'; returns null on failure */
function safeDateKey(dateStr: unknown): string | null {
    const d = safeParseDate(dateStr);
    if (!d) return null;
    try {
        return format(d, 'yyyy-MM-dd');
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days);
        const endDate = new Date();

        // Get all profiles (without the activities jsonb to keep it lightweight)
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, total_xp, videos_count, game_time_spent, created_at');

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
        }

        const allProfiles = profiles || [];

        // Generate date range
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

        // User Growth Chart - Count users created per day
        const userGrowth = dateRange.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const count = allProfiles.filter(p => {
                const key = safeDateKey(p.created_at);
                return key === dateStr;
            }).length;
            return {
                date: format(date, 'MMM d'),
                count,
            };
        });

        // XP Distribution Chart
        const xpRanges = [
            { min: 0, max: 99, label: '0-99' },
            { min: 100, max: 499, label: '100-499' },
            { min: 500, max: 999, label: '500-999' },
            { min: 1000, max: 4999, label: '1K-5K' },
            { min: 5000, max: 9999, label: '5K-10K' },
            { min: 10000, max: Infinity, label: '10K+' },
        ];

        const xpDistribution = xpRanges.map(range => {
            const count = allProfiles.filter(p => {
                const xp = p.total_xp || 0;
                return xp >= range.min && xp <= range.max;
            }).length;
            return {
                range: range.label,
                count,
            };
        });

        // Top Users by XP
        const topUsers = [...allProfiles]
            .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
            .slice(0, 10)
            .map(p => ({
                name: p.full_name || 'Unknown',
                xp: p.total_xp || 0,
            }));

        // All Users by Game Time
        const topUsersByGameTime = [...allProfiles]
            .sort((a, b) => (b.game_time_spent || 0) - (a.game_time_spent || 0))
            .map(p => ({
                name: p.full_name || 'Unknown',
                gameTime: p.game_time_spent || 0,
            }));

        // Activity Timeline - Use user_activities table for real data
        let activityTimeline: { date: string; count: number }[] = [];
        try {
            const { data: userActivities } = await supabase
                .from('user_activities')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            // Build a map of date -> count from user_activities
            const activityCountMap: Record<string, number> = {};
            (userActivities || []).forEach(ua => {
                const key = safeDateKey(ua.created_at);
                if (key) {
                    activityCountMap[key] = (activityCountMap[key] || 0) + 1;
                }
            });

            activityTimeline = dateRange.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return {
                    date: format(date, 'MMM d'),
                    count: activityCountMap[dateStr] || 0,
                };
            });
        } catch (err) {
            console.error('Error fetching activity timeline:', err);
            activityTimeline = dateRange.map(date => ({
                date: format(date, 'MMM d'),
                count: 0,
            }));
        }

        // Recent activities from user_activities table
        let recentActivities: { userName: string; activity: { text: string; date: string } }[] = [];
        try {
            const { data: recentUserActivities } = await supabase
                .from('user_activities')
                .select('activity_type, activity_details, created_at, user_id')
                .order('created_at', { ascending: false })
                .limit(20);

            if (recentUserActivities && recentUserActivities.length > 0) {
                // Fetch the profile names for these users
                const userIds = [...new Set(recentUserActivities.map(a => a.user_id))];
                const { data: userProfiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', userIds);

                const nameMap: Record<string, string> = {};
                (userProfiles || []).forEach(p => {
                    nameMap[p.id] = p.full_name || 'Unknown User';
                });

                recentActivities = recentUserActivities.map(ua => {
                    const details = ua.activity_details as Record<string, unknown> | null;
                    const text = (details?.description as string)
                        || (details?.screen as string)
                        || ua.activity_type
                        || 'Activity';
                    return {
                        userName: nameMap[ua.user_id] || 'Unknown User',
                        activity: {
                            text,
                            date: ua.created_at,
                        },
                    };
                });
            }
        } catch (err) {
            console.error('Error fetching recent activities:', err);
        }

        // Video Trends - count video_uploaded activities per day
        let videoTrends: { date: string; count: number }[] = [];
        try {
            const { data: videoActivities } = await supabase
                .from('user_activities')
                .select('created_at')
                .eq('activity_type', 'video_uploaded')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            const videoCountMap: Record<string, number> = {};
            (videoActivities || []).forEach(va => {
                const key = safeDateKey(va.created_at);
                if (key) {
                    videoCountMap[key] = (videoCountMap[key] || 0) + 1;
                }
            });

            videoTrends = dateRange.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                return {
                    date: format(date, 'MMM d'),
                    count: videoCountMap[dateStr] || 0,
                };
            });
        } catch (err) {
            console.error('Error fetching video trends:', err);
            videoTrends = dateRange.map(date => ({
                date: format(date, 'MMM d'),
                count: 0,
            }));
        }

        const analytics = {
            userGrowth,
            xpDistribution,
            topUsers,
            topUsersByGameTime,
            videoTrends,
            activityTimeline,
            recentActivities,
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error in analytics API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
