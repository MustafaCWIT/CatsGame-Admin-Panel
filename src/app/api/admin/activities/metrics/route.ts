import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ActivityMetrics } from '@/types/database';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        const today = startOfDay(new Date());
        const todayISO = today.toISOString();

        // Get total activities
        const { count: totalActivities } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true });

        // Get unique users
        const { count: totalUsers } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true });

        // Get active sessions today (session_start events)
        const { count: activeSessionsToday } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'session_start')
            .gte('created_at', todayISO);

        // Get game sessions (game_started events)
        const { count: gameSessions } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'game_started');

        // Get video uploads (video_uploaded events)
        const { count: videoUploads } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'video_uploaded');

        // Get conversion rate (users who completed upload / users who clicked upload)
        const { count: clickedUpload } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'upload_button_clicked');

        const { count: completedUpload } = await supabase
            .from('user_activities')
            .select('user_id', { count: 'exact', head: true })
            .eq('activity_type', 'video_uploaded');

        const conversionRate = clickedUpload && clickedUpload > 0
            ? Math.round((completedUpload || 0) / clickedUpload * 100)
            : 0;

        // Get average game score
        const { data: gameEndedData } = await supabase
            .from('user_activities')
            .select('activity_details')
            .eq('activity_type', 'game_ended');

        let averageGameScore = 0;
        if (gameEndedData && gameEndedData.length > 0) {
            const scores = gameEndedData
                .map(item => item.activity_details?.score)
                .filter(score => typeof score === 'number') as number[];
            if (scores.length > 0) {
                averageGameScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            }
        }

        // Get average session duration
        const { data: sessionData } = await supabase
            .from('user_activities')
            .select('activity_details')
            .eq('activity_type', 'game_ended');

        let averageSessionDuration = 0;
        if (sessionData && sessionData.length > 0) {
            const durations = sessionData
                .map(item => item.activity_details?.sessionTime)
                .filter(duration => typeof duration === 'number') as number[];
            if (durations.length > 0) {
                averageSessionDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
            }
        }

        const metrics: ActivityMetrics = {
            totalActivities: totalActivities || 0,
            totalUsers: totalUsers || 0,
            activeSessionsToday: activeSessionsToday || 0,
            gameSessions: gameSessions || 0,
            videoUploads: videoUploads || 0,
            conversionRate,
            averageGameScore,
            averageSessionDuration,
        };

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error in activity metrics API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

