'use client';

import { useClarityTracking } from '@/hooks/useClarity';

/**
 * Component to enable Clarity tracking in admin routes
 * Automatically tracks page views and identifies admin users
 * 
 * Note: Only tracks if NEXT_PUBLIC_CLARITY_TRACK_ADMIN=true
 * For game app tracking, use Clarity in your game app instead
 */
export function ClarityTracking() {
    // Only track if explicitly enabled
    const shouldTrack = process.env.NEXT_PUBLIC_CLARITY_TRACK_ADMIN === 'true';
    
    if (!shouldTrack) {
        return null; // Skip tracking if not enabled
    }
    
    useClarityTracking();
    return null;
}

