import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserActivity } from '@/types/database';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        const searchParams = request.nextUrl.searchParams;

        // Return distinct activity types if requested
        if (searchParams.get('distinct') === 'activity_type') {
            const { data, error } = await supabase
                .from('user_activities')
                .select('activity_type')
                .order('activity_type', { ascending: true });

            if (error) {
                return NextResponse.json({ error: 'Failed to fetch activity types' }, { status: 500 });
            }

            const uniqueTypes = [...new Set((data || []).map(d => d.activity_type))];
            return NextResponse.json({ types: uniqueTypes });
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const activityType = searchParams.get('activityType');
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;

        // Build query - fetch activities first (no join since FK relationship may not be detected)
        let query = supabase
            .from('user_activities')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        // Apply filters
        if (activityType) {
            query = query.eq('activity_type', activityType);
        }

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (startDate) {
            query = query.gte('created_at', startDate);
        }

        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        if (search) {
            // First, find user IDs matching the search term by phone
            const { data: matchingProfiles } = await supabase
                .from('profiles')
                .select('id')
                .ilike('phone', `%${search}%`);

            const matchingUserIds = (matchingProfiles || []).map((p: any) => p.id);

            if (matchingUserIds.length > 0) {
                // Search activity_type OR matching user IDs
                query = query.or(`activity_type.ilike.%${search}%,user_id.in.(${matchingUserIds.join(',')})`);
            } else {
                // No matching users, only search activity_type
                query = query.ilike('activity_type', `%${search}%`);
            }
        }

        // Get total count and data
        const { data: activitiesData, error, count } = await query.range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching activities:', error);
            return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
        }

        // Get unique user IDs to fetch profiles separately
        const userIds = [...new Set((activitiesData || []).map((item: any) => item.user_id).filter(Boolean))];

        // Fetch profiles for these users (manual join since FK relationship not detected by PostgREST)
        let profilesMap = new Map();
        if (userIds.length > 0) {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, phone, total_xp, videos_count')
                .in('id', userIds);

            profilesMap = new Map(
                (profilesData || []).map((profile: any) => [profile.id, profile])
            );
        }

        // Transform data to include user info
        const activities: UserActivity[] = (activitiesData || []).map((item: any) => {
            const profile = profilesMap.get(item.user_id);
            return {
                id: item.id,
                user_id: item.user_id,
                activity_type: item.activity_type,
                activity_details: item.activity_details,
                created_at: item.created_at,
                user_phone: profile?.phone || null,
                user_total_xp: profile?.total_xp || 0,
                user_videos_count: profile?.videos_count || 0,
            };
        });

        const totalPages = count ? Math.ceil(count / limit) : 1;

        return NextResponse.json({
            data: activities,
            total: count || 0,
            page,
            limit,
            totalPages,
        });
    } catch (error) {
        console.error('Error in activities API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
