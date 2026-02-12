import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GamePerformanceMetrics } from '@/types/database';
import { subDays } from 'date-fns';

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

        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '7');
        const startDate = subDays(new Date(), days).toISOString();

        // Get all game_ended events
        const { data: gameEndedData } = await supabase
            .from('user_activities')
            .select('activity_details')
            .eq('activity_type', 'game_ended')
            .gte('created_at', startDate);

        if (!gameEndedData || gameEndedData.length === 0) {
            return NextResponse.json({
                averageScore: 0,
                averageSessionTime: 0,
                totalGames: 0,
                completionRate: 0,
                averageScoreByLevel: [],
            });
        }

        // Calculate averages
        const scores = gameEndedData
            .map(item => item.activity_details?.score)
            .filter(score => typeof score === 'number') as number[];

        const sessionTimes = gameEndedData
            .map(item => item.activity_details?.sessionTime)
            .filter(time => typeof time === 'number') as number[];

        const levels = gameEndedData
            .map(item => item.activity_details?.level)
            .filter(level => typeof level === 'number') as number[];

        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        const averageSessionTime = sessionTimes.length > 0
            ? Math.round(sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length)
            : 0;

        // Calculate completion rate (game_ended / game_started)
        const { count: gameStarted } = await supabase
            .from('user_activities')
            .select('*', { count: 'exact', head: true })
            .eq('activity_type', 'game_started')
            .gte('created_at', startDate);

        const completionRate = gameStarted && gameStarted > 0
            ? Math.round((gameEndedData.length / gameStarted) * 100)
            : 0;

        // Calculate average score by level
        const levelScoreMap = new Map<number, { total: number; count: number }>();
        
        gameEndedData.forEach(item => {
            const level = item.activity_details?.level;
            const score = item.activity_details?.score;
            if (typeof level === 'number' && typeof score === 'number') {
                const existing = levelScoreMap.get(level) || { total: 0, count: 0 };
                levelScoreMap.set(level, {
                    total: existing.total + score,
                    count: existing.count + 1,
                });
            }
        });

        const averageScoreByLevel = Array.from(levelScoreMap.entries())
            .map(([level, data]) => ({
                level,
                avgScore: Math.round(data.total / data.count),
                count: data.count,
            }))
            .sort((a, b) => a.level - b.level);

        const metrics: GamePerformanceMetrics = {
            averageScore,
            averageSessionTime,
            totalGames: gameEndedData.length,
            completionRate,
            averageScoreByLevel,
        };

        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error in game performance API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

