'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initClarity } from '@/lib/clarity';

/**
 * Clarity Provider Component
 * Initializes Microsoft Clarity analytics
 * 
 * Note: This is for tracking the admin panel itself.
 * For tracking your Cats Game app, use the integration guide in CLARITY_INTEGRATION.md
 * 
 * Add your Clarity Project ID to NEXT_PUBLIC_CLARITY_PROJECT_ID in .env.local
 */
export function ClarityProvider() {
    const pathname = usePathname();
    
    useEffect(() => {
        // Only initialize if you want to track admin panel usage
        // For game app tracking, initialize Clarity in your game app instead
        const shouldTrackAdmin = process.env.NEXT_PUBLIC_CLARITY_TRACK_ADMIN === 'true';
        
        if (!shouldTrackAdmin) {
            return; // Skip admin panel tracking
        }
        
        const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
        
        if (projectId) {
            initClarity(projectId);
        }
    }, [pathname]);

    return null;
}

