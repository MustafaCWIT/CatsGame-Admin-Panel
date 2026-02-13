import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days);
        const endDate = new Date();

        // Get all profiles with activities
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, total_xp, videos_count, game_time_spent, activities, created_at');

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
                if (!p.created_at) return false;
                return format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr;
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
        const topUsers = allProfiles
            .sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0))
            .slice(0, 10)
            .map(p => ({
                name: p.full_name || 'Unknown',
                xp: p.total_xp || 0,
            }));

        // All Users by Game Time
        const topUsersByGameTime = allProfiles
            .sort((a, b) => (b.game_time_spent || 0) - (a.game_time_spent || 0))
            .map(p => ({
                name: p.full_name || 'Unknown',
                gameTime: p.game_time_spent || 0,
            }));

        // Video Trends - Simulated as we don't have daily video data
        // In production, you'd track this in a separate table
        const videoTrends = dateRange.map((date, index) => ({
            date: format(date, 'MMM d'),
            count: Math.floor(Math.random() * 20) + 5, // Simulated data
        }));

        // Activity Timeline - Count activities per day
        const activityTimeline = dateRange.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            let count = 0;

            allProfiles.forEach(p => {
                if (p.activities && Array.isArray(p.activities)) {
                    p.activities.forEach((activity: { date: string }) => {
                        if (activity.date && format(new Date(activity.date), 'yyyy-MM-dd') === dateStr) {
                            count++;
                        }
                    });
                }
            });

            return {
                date: format(date, 'MMM d'),
                count,
            };
        });

        // Recent activities for feed
        const recentActivities: { userName: string; activity: { text: string; date: string } }[] = [];

        allProfiles.forEach(p => {
            if (p.activities && Array.isArray(p.activities)) {
                p.activities.forEach((activity: { text: string; date: string }) => {
                    if (activity.date) {
                        recentActivities.push({
                            userName: p.full_name || 'Unknown User',
                            activity: {
                                text: activity.text,
                                date: activity.date,
                            },
                        });
                    }
                });
            }
        });

        // Sort by date and take last 20
        const sortedActivities = recentActivities
            .sort((a, b) => new Date(b.activity.date).getTime() - new Date(a.activity.date).getTime())
            .slice(0, 20);

        const analytics = {
            userGrowth,
            xpDistribution,
            topUsers,
            topUsersByGameTime,
            videoTrends,
            activityTimeline,
            recentActivities: sortedActivities,
        };

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Error in analytics API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
