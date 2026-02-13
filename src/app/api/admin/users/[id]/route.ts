import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLevelForXP } from '@/types/database';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const supabase = createAdminClient();

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            console.error('Error fetching profile:', profileError);
            return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
        }

        return NextResponse.json({
            ...profile,
            level: getLevelForXP(profile.total_xp || 0),
        });
    } catch (error) {
        console.error('Error in user GET API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        // Get request body
        const body = await request.json();
        const { phone, total_xp, videos_count, activities, role } = body;

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (phone !== undefined) updateData.phone = phone;
        if (total_xp !== undefined) updateData.total_xp = total_xp;
        if (videos_count !== undefined) updateData.videos_count = videos_count;
        if (activities !== undefined) updateData.activities = activities;
        if (role !== undefined) updateData.role = role;
        updateData.updated_at = new Date().toISOString();

        const adminClient = createAdminClient();

        // Update profile
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (profileError) {
            if (profileError.code === 'PGRST116') {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            console.error('Error updating profile:', profileError);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        return NextResponse.json({
            ...profile,
            level: getLevelForXP(profile.total_xp || 0),
        });
    } catch (error) {
        console.error('Error in user PATCH API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const auth = await requireAdmin();
        if ('error' in auth) return auth.error;

        const adminClient = createAdminClient();

        // Delete profile directly
        const { error: deleteError } = await adminClient
            .from('profiles')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error in user DELETE API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
