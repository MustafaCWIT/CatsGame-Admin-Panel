import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = subDays(new Date(), days).toISOString();
        const today = startOfDay(new Date()).toISOString();

        // Get total sessions (session_start events)
        const { count: totalSessions } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'session_start')
            .gte('created_at', startDate);

        // Get unique users with sessions
        const { data: sessionData } = await supabase
            .from('user_activities')
            .select('user_id, activity_details, created_at')
            .eq('activity_type', 'session_start')
            .gte('created_at', startDate)
            .order('created_at', { ascending: false })
            .limit(1000);

        // Calculate average session duration from game_ended events
        const { data: gameEndedData } = await supabase
            .from('user_activities')
            .select('activity_details, created_at, user_id')
            .eq('activity_type', 'game_ended')
            .gte('created_at', startDate);

        let avgSessionDuration = 0;
        if (gameEndedData && gameEndedData.length > 0) {
            const durations = gameEndedData
                .map(item => item.activity_details?.sessionTime)
                .filter(duration => typeof duration === 'number') as number[];
            if (durations.length > 0) {
                avgSessionDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
            }
        }

        // Get total page views (screen-* events)
        const { count: totalPageViews } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true })
            .like('activity_type', 'screen-%')
            .gte('created_at', startDate);

        // Calculate bounce rate (sessions with only one screen view)
        const { data: screenViews } = await supabase
            .from('user_activities')
            .select('user_id, created_at')
            .like('activity_type', 'screen-%')
            .gte('created_at', startDate);

        // Group screen views by user session (same user, within 30 minutes)
        const userSessions = new Map<string, number>();
        if (screenViews) {
            screenViews.forEach(view => {
                const key = `${view.user_id}-${new Date(view.created_at).toISOString().split('T')[0]}`;
                userSessions.set(key, (userSessions.get(key) || 0) + 1);
            });
        }

        const singlePageSessions = Array.from(userSessions.values()).filter(count => count === 1).length;
        const bounceRate = userSessions.size > 0
            ? Math.round((singlePageSessions / userSessions.size) * 100)
            : 0;

        // Get top pages (screen-* events grouped)
        const { data: allScreenViews } = await supabase
            .from('user_activities')
            .select('activity_type')
            .like('activity_type', 'screen-%')
            .gte('created_at', startDate);

        const pageCounts = new Map<string, number>();
        if (allScreenViews) {
            allScreenViews.forEach(view => {
                const page = view.activity_type.replace('screen-', '');
                pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
            });
        }

        const topPages = Array.from(pageCounts.entries())
            .map(([path, views]) => ({ path, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 10);

        // Get recent sessions (last 20 session_start events)
        const { data: recentSessionsData } = await supabase
            .from('user_activities')
            .select('id, user_id, created_at, activity_details')
            .eq('activity_type', 'session_start')
            .gte('created_at', startDate)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get user profiles for recent sessions (manual join)
        const sessionUserIds = [...new Set((recentSessionsData || []).map((s: any) => s.user_id).filter(Boolean))];
        let profilesMap = new Map();
        if (sessionUserIds.length > 0) {
            const { data: sessionProfiles } = await supabase
                .from('profiles')
                .select('id, phone')
                .in('id', sessionUserIds);

            profilesMap = new Map(
                (sessionProfiles || []).map((p: any) => [p.id, p])
            );
        }

        const recentSessions = (recentSessionsData || []).map(session => {
            // Try to find matching game_ended to get duration
            let duration = 0;
            if (gameEndedData) {
                const matchingGame = gameEndedData.find(
                    game => game.user_id === session.user_id &&
                    new Date(game.created_at) > new Date(session.created_at) &&
                    new Date(game.created_at).getTime() - new Date(session.created_at).getTime() < 3600000 // within 1 hour
                );
                if (matchingGame?.activity_details?.sessionTime) {
                    duration = matchingGame.activity_details.sessionTime;
                }
            }

            const profile = profilesMap.get(session.user_id);
            return {
                id: session.id,
                userId: session.user_id,
                duration,
                timestamp: session.created_at,
                userName: profile?.phone || 'Unknown',
            };
        });

        return NextResponse.json({
            totalSessions: totalSessions || 0,
            avgSessionDuration,
            totalPageViews: totalPageViews || 0,
            bounceRate,
            topPages,
            recentSessions,
        });
    } catch (error) {
        console.error('Error in Clarity stats API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
