import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLevelForXP } from '@/types/database';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

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

        // Apply search filter (phone-based)
        if (search) {
            query = query.ilike('phone', `%${search}%`);
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
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        // Get request body
        const body = await request.json();
        const { phone, password, total_xp = 0, videos_count = 0, role = 'user' } = body;

        // Validate required fields
        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Missing required fields: phone and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        // Check if phone already exists
        const { data: existing } = await adminClient
            .from('profiles')
            .select('id')
            .eq('phone', phone)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: 'A user with this phone number already exists' },
                { status: 400 }
            );
        }

        // Hash password with SHA-256 (same as game app)
        const hashedPassword = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        // Create profile directly in profiles table
        const { data: newProfile, error: newProfileError } = await adminClient
            .from('profiles')
            .insert({
                phone,
                password: hashedPassword,
                total_xp,
                videos_count,
                activities: [],
                updated_at: new Date().toISOString(),
                role: role || 'user',
            })
            .select()
            .single();

        if (newProfileError) {
            console.error('Error creating profile:', newProfileError);
            return NextResponse.json(
                { error: `Failed to create user: ${newProfileError.message}` },
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
