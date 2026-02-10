import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        // Missing environment variables - return response without processing
        return supabaseResponse;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh user session if expired
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = request.nextUrl.pathname === '/login';
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname === '/';
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');

    // Skip middleware for API routes (they handle their own auth)
    if (isApiRoute) {
        return supabaseResponse;
    }

    // If user is not authenticated and trying to access admin routes
    if (!user && isAdminRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If user is authenticated and on login page, redirect to admin dashboard
    if (user && isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }

    // If user is authenticated, check if they have admin panel access
    if (user && isAdminRoute) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Allow access for admin, manager, and readonly roles
        const allowedRoles = ['admin', 'manager', 'readonly'];
        if (!profile?.role || !allowedRoles.includes(profile.role)) {
            // Not authorized, redirect to login with error
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
