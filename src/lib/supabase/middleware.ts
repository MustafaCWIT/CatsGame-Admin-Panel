import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionFromCookieString } from '@/lib/admin-auth';

export async function updateSession(request: NextRequest) {
    const isLoginPage = request.nextUrl.pathname === '/login';
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname === '/';
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');

    // Skip middleware for API routes (they handle their own auth)
    if (isApiRoute) {
        return NextResponse.next();
    }

    // Check custom session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const session = verifySessionFromCookieString(cookieHeader);

    // If user is not authenticated and trying to access admin routes
    if (!session && isAdminRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If user is authenticated and on login page, redirect to admin dashboard
    if (session && isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }

    // If user is authenticated, check if they have admin panel access
    if (session && isAdminRoute) {
        const allowedRoles = ['admin', 'manager', 'readonly'];
        if (!allowedRoles.includes(session.role)) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}
