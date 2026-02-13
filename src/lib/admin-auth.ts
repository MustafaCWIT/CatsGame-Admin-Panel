import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
    const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) {
        throw new Error('Missing SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY');
    }
    return secret;
}

/** Sign a payload into a token: base64(payload).base64(hmac) */
function signToken(payload: Record<string, unknown>): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const hmac = crypto
        .createHmac('sha256', getSecret())
        .update(data)
        .digest('base64url');
    return `${data}.${hmac}`;
}

/** Verify and decode a signed token. Returns null if invalid. */
function verifyToken(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [data, hmac] = parts;
    const expectedHmac = crypto
        .createHmac('sha256', getSecret())
        .update(data)
        .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
        // Check expiry
        if (payload.exp && Date.now() > payload.exp) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
}

export interface AdminSession {
    userId: string;
    phone: string;
    role: string;
}

/** Create a session token for the given admin user */
export function createSessionToken(session: AdminSession): string {
    return signToken({
        sub: session.userId,
        phone: session.phone,
        role: session.role,
        exp: Date.now() + SESSION_MAX_AGE * 1000,
    });
}

/** Verify the session cookie from API routes (using next/headers) */
export async function verifyAdminSession(): Promise<AdminSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    return {
        userId: payload.sub as string,
        phone: payload.phone as string,
        role: payload.role as string,
    };
}

/** Verify session from a raw cookie header string (for middleware) */
export function verifySessionFromCookieString(cookieHeader: string): AdminSession | null {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (!match) return null;

    const payload = verifyToken(match[1]);
    if (!payload) return null;

    return {
        userId: payload.sub as string,
        phone: payload.phone as string,
        role: payload.role as string,
    };
}

/** Cookie options for the session cookie */
export function getSessionCookieOptions() {
    return {
        name: SESSION_COOKIE_NAME,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: SESSION_MAX_AGE,
    };
}

/** Helper to verify admin session and return NextResponse error if unauthorized.
 *  Use in API routes to replace the old supabase.auth.getUser() pattern. */
export async function requireAdmin(): Promise<{ session: AdminSession } | { error: Response }> {
    const session = await verifyAdminSession();

    if (!session) {
        const { NextResponse } = await import('next/server');
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const allowedRoles = ['admin', 'manager', 'readonly'];
    if (!allowedRoles.includes(session.role)) {
        const { NextResponse } = await import('next/server');
        return { error: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }) };
    }

    return { session };
}
