import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Profile, getLevelForXP } from '@/types/database';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: adminProfile, error: adminProfileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (adminProfileError || adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const sortBy = searchParams.get('sortBy') || 'updated_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const xpMin = searchParams.get('xpMin');
        const xpMax = searchParams.get('xpMax');
        const videosMin = searchParams.get('videosMin');
        const videosMax = searchParams.get('videosMax');

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' });

        // Apply search filter
        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        // Apply XP filters
        if (xpMin) {
            query = query.gte('total_xp', parseInt(xpMin));
        }
        if (xpMax) {
            query = query.lte('total_xp', parseInt(xpMax));
        }

        // Apply videos filters
        if (videosMin) {
            query = query.gte('videos_count', parseInt(videosMin));
        }
        if (videosMax) {
            query = query.lte('videos_count', parseInt(videosMax));
        }

        // Apply sorting
        const ascending = sortOrder === 'asc';
        query = query.order(sortBy, { ascending });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: profiles, error: profilesError, count } = await query;

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Add level to each profile
        const usersWithLevel = (profiles || []).map(profile => ({
            ...profile,
            level: getLevelForXP(profile.total_xp || 0),
        }));

        return NextResponse.json({
            data: usersWithLevel,
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit),
        });
    } catch (error) {
        console.error('Error in users GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: adminProfile, error: adminProfileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (adminProfileError || adminProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }

        // Get request body
        const body = await request.json();
        const { full_name, email, phone, password, total_xp = 0, videos_count = 0 } = body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields: full_name, email, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Use admin client to create user
        const adminClient = createAdminClient();

        // Create auth user
        const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createAuthError) {
            console.error('Error creating auth user:', createAuthError);
            return NextResponse.json(
                { error: createAuthError.message || 'Failed to create user' },
                { status: 400 }
            );
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Create profile
        const { data: newProfile, error: newProfileError } = await adminClient
            .from('profiles')
            .upsert({
                id: authData.user.id,
                full_name,
                email,
                phone: phone || null,
                total_xp,
                videos_count,
                activities: [],
                updated_at: new Date().toISOString(),
                role: 'user', // Ensure default role is set
            })
            .select()
            .single();

        if (newProfileError) {
            // Rollback - delete auth user if profile creation fails
            await adminClient.auth.admin.deleteUser(authData.user.id);
            console.error('Error creating/upserting profile:', newProfileError);
            return NextResponse.json(
                { error: `Failed to create user profile: ${newProfileError.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json({
            ...newProfile,
            level: getLevelForXP(newProfile.total_xp || 0),
        }, { status: 201 });
    } catch (error) {
        console.error('Error in users POST API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
