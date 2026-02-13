import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { subDays, startOfDay, startOfWeek, startOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        const now = new Date();
        const today = startOfDay(now);
        const thisWeek = startOfWeek(now);
        const thisMonth = startOfMonth(now);
        const thirtyDaysAgo = subDays(now, 30);

        // Get all profiles for stats calculation
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, total_xp, videos_count, game_time_spent, updated_at, created_at');

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
        }

        const allProfiles = profiles || [];

        // Calculate statistics
        const totalUsers = allProfiles.length;
        const totalXP = allProfiles.reduce((sum, p) => sum + (p.total_xp || 0), 0);
        const totalVideos = allProfiles.reduce((sum, p) => sum + (p.videos_count || 0), 0);
        const totalGameTime = allProfiles.reduce((sum, p) => sum + (p.game_time_spent || 0), 0);
        const avgXP = totalUsers > 0 ? Math.round(totalXP / totalUsers) : 0;

        // Active users (updated in last 30 days)
        const activeUsers = allProfiles.filter(p => {
            if (!p.updated_at) return false;
            return new Date(p.updated_at) >= thirtyDaysAgo;
        }).length;

        // New users calculations
        const newUsersThisMonth = allProfiles.filter(p => {
            const createdAt = p.created_at ? new Date(p.created_at) : null;
            return createdAt && createdAt >= thisMonth;
        }).length;

        const newUsersThisWeek = allProfiles.filter(p => {
            const createdAt = p.created_at ? new Date(p.created_at) : null;
            return createdAt && createdAt >= thisWeek;
        }).length;

        const newUsersToday = allProfiles.filter(p => {
            const createdAt = p.created_at ? new Date(p.created_at) : null;
            return createdAt && createdAt >= today;
        }).length;

        const stats = {
            totalUsers,
            activeUsers,
            totalXP,
            totalVideos,
            totalGameTime,
            avgXP,
            newUsersThisMonth,
            newUsersThisWeek,
            newUsersToday,
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error in stats API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
