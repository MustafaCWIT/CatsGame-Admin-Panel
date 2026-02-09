import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLevelForXP } from '@/types/database';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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
        const { full_name, email, phone, total_xp, videos_count, activities } = body;

        // Build update object
        const updateData: Record<string, unknown> = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (total_xp !== undefined) updateData.total_xp = total_xp;
        if (videos_count !== undefined) updateData.videos_count = videos_count;
        if (activities !== undefined) updateData.activities = activities;
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

        // If email is being updated, also update auth user
        if (email) {
            const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(id, {
                email,
            });

            if (authUpdateError) {
                console.error('Error updating auth user email:', authUpdateError);
                // Continue anyway - profile was updated
            }
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

        const adminClient = createAdminClient();

        // Delete from auth (will cascade to profiles due to foreign key)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

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
