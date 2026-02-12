'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { identifyAdminUser, trackEvent, setTag, AdminEvents } from '@/lib/clarity';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

/**
 * Hook to track admin user activity with Clarity
 * Automatically identifies user and tracks page views
 */
export function useClarityTracking() {
    const pathname = usePathname();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        async function setupTracking() {
            // Only track in admin routes
            if (!pathname?.startsWith('/admin')) {
                return;
            }

            // Wait a bit for Clarity to initialize (if it's being initialized)
            // Check if Clarity should be initialized for admin panel
            const shouldTrackAdmin = process.env.NEXT_PUBLIC_CLARITY_TRACK_ADMIN === 'true';
            if (!shouldTrackAdmin) {
                // Clarity is not being initialized for admin panel, skip tracking
                return;
            }

            // Wait for Clarity to be available (with timeout)
            let attempts = 0;
            const maxAttempts = 10;
            const checkClarity = () => {
                if (typeof window !== 'undefined' && 
                    (typeof (window as any).clarity?.identify === 'function' || 
                     typeof (window as any).clarity?.init === 'function')) {
                    return true;
                }
                return false;
            };

            const waitForClarity = async () => {
                while (attempts < maxAttempts && !checkClarity()) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                return checkClarity();
            };

            try {
                const clarityReady = await waitForClarity();
                
                if (!clarityReady) {
                    console.warn('Clarity not available after waiting. Skipping admin tracking.');
                    return;
                }

                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Get user profile for role and name
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', user.id)
                        .single();

                    // Identify admin user
                    identifyAdminUser(
                        user.id,
                        user.email || '',
                        profile?.full_name || undefined,
                        profile?.role || undefined
                    );

                    // Set page-specific tags
                    setTag('current_page', pathname);
                    setTag('admin_panel', 'true');

                    // Track page view
                    trackEvent(`${AdminEvents.DASHBOARD_VIEWED}_${pathname.replace(/\//g, '_')}`);

                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('Clarity tracking setup error:', error);
            }
        }

        setupTracking();
    }, [pathname]);

    return { isInitialized };
}

/**
 * Hook to track specific admin actions
 */
export function useAdminTracking() {
    const trackChartView = (chartName: string) => {
        trackEvent(AdminEvents.CHART_VIEWED);
        setTag('chart_name', chartName);
    };

    const trackUserAction = (action: string, userId?: string) => {
        trackEvent(action);
        if (userId) {
            setTag('target_user_id', userId);
        }
    };

    const trackSearch = (searchTerm: string, resultsCount: number) => {
        trackEvent(AdminEvents.USER_SEARCHED);
        setTag('search_term', searchTerm);
        setTag('search_results_count', resultsCount.toString());
    };

    const trackFilter = (filterType: string, filterValue: string) => {
        trackEvent(AdminEvents.USER_FILTERED);
        setTag('filter_type', filterType);
        setTag('filter_value', filterValue);
    };

    const trackError = (errorType: string, errorMessage: string) => {
        trackEvent(AdminEvents.ERROR_OCCURRED);
        setTag('error_type', errorType);
        setTag('error_message', errorMessage.substring(0, 100)); // Limit length
    };

    return {
        trackChartView,
        trackUserAction,
        trackSearch,
        trackFilter,
        trackError,
    };
}

