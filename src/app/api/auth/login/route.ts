import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSessionToken, getSessionCookieOptions } from '@/lib/admin-auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        if (!phone || !password) {
            return NextResponse.json(
                { error: 'Phone number and password are required' },
                { status: 400 }
            );
        }

        const adminClient = createAdminClient();

        // Look up profile by phone
        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('id, phone, password, role')
            .eq('phone', phone)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'Invalid phone number or password.' },
                { status: 401 }
            );
        }

        // Only allow admin/manager/readonly roles
        const allowedRoles = ['admin', 'manager', 'readonly'];
        if (!profile.role || !allowedRoles.includes(profile.role)) {
            return NextResponse.json(
                { error: 'You do not have admin access.' },
                { status: 403 }
            );
        }

        // Hash the input password with SHA-256 (same as the game app)
        const hashedPassword = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        if (hashedPassword !== profile.password) {
            return NextResponse.json(
                { error: 'Invalid phone number or password.' },
                { status: 401 }
            );
        }

        // Create signed session token
        const token = createSessionToken({
            userId: profile.id,
            phone: profile.phone,
            role: profile.role,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions();
        const response = NextResponse.json({ success: true });
        response.cookies.set(cookieOptions.name, token, {
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
            path: cookieOptions.path,
            maxAge: cookieOptions.maxAge,
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
