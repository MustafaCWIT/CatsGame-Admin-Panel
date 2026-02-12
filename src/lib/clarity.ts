'use client';

import Clarity from '@microsoft/clarity';

// Check if Clarity is initialized and available
function isClarityAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if Clarity object exists and has the required methods
    try {
        // Check if Clarity is defined and has the event method
        if (!Clarity || typeof Clarity !== 'object') {
            return false;
        }
        
        // Check if the event method exists and is a function
        if (typeof Clarity.event !== 'function') {
            return false;
        }
        
        // Also check if Clarity has been initialized by checking window.clarity
        // Clarity.init() sets up window.clarity
        if (typeof (window as any).clarity === 'undefined') {
            return false;
        }
        
        return true;
    } catch {
        return false;
    }
}

// Initialize Clarity with project ID
export function initClarity(projectId: string) {
    if (typeof window !== 'undefined' && projectId) {
        try {
            Clarity.init(projectId);
        } catch (error) {
            console.error('Error initializing Clarity:', error);
        }
    }
}

// Identify admin user
export function identifyAdminUser(
    userId: string,
    userEmail: string,
    userName?: string,
    role?: string
) {
    if (typeof window === 'undefined') {
        return;
    }

    // Double-check before calling
    if (!Clarity || typeof Clarity.identify !== 'function') {
        return; // Silently skip if Clarity is not available
    }

    try {
        // Use userId as customId (will be hashed by Clarity)
        // Use session ID for tracking admin sessions
        const sessionId = `admin-${userId}-${Date.now()}`;
        const pageId = window.location.pathname;
        
        Clarity.identify(
            userId,
            sessionId,
            pageId,
            userName || userEmail
        );

        // Set role as a tag for filtering
        if (role && Clarity.setTag) {
            Clarity.setTag('admin_role', role);
        }
    } catch (error) {
        // Silently fail - don't log errors for missing Clarity
        if (error instanceof Error && !error.message.includes('clarity')) {
            console.error('Error identifying user in Clarity:', error);
        }
    }
}

// Track custom events
export function trackEvent(eventName: string) {
    if (typeof window === 'undefined') {
        return;
    }

    // Double-check before calling
    if (!Clarity || typeof Clarity.event !== 'function') {
        return; // Silently skip if Clarity is not available
    }

    try {
        Clarity.event(eventName);
    } catch (error) {
        // Silently fail - don't log errors for missing Clarity
        if (error instanceof Error && !error.message.includes('clarity')) {
            console.error('Error tracking event in Clarity:', error);
        }
    }
}

// Set custom tags
export function setTag(key: string, value: string | string[]) {
    if (typeof window === 'undefined') {
        return;
    }

    // Double-check before calling
    if (!Clarity || typeof Clarity.setTag !== 'function') {
        return; // Silently skip if Clarity is not available
    }

    try {
        Clarity.setTag(key, value);
    } catch (error) {
        // Silently fail - don't log errors for missing Clarity
        if (error instanceof Error && !error.message.includes('clarity')) {
            console.error('Error setting tag in Clarity:', error);
        }
    }
}

// Upgrade session (prioritize recording)
export function upgradeSession(reason: string) {
    if (!isClarityAvailable()) {
        return; // Silently skip if Clarity is not available
    }

    try {
        Clarity.upgrade(reason);
    } catch (error) {
        console.error('Error upgrading session in Clarity:', error);
    }
}

// Admin-specific tracking events
export const AdminEvents = {
    // Dashboard events
    DASHBOARD_VIEWED: 'admin_dashboard_viewed',
    CHART_VIEWED: 'admin_chart_viewed',
    STATS_CARD_CLICKED: 'admin_stats_card_clicked',
    
    // User management events
    USERS_PAGE_VIEWED: 'admin_users_page_viewed',
    USER_DETAILS_VIEWED: 'admin_user_details_viewed',
    USER_EDIT_STARTED: 'admin_user_edit_started',
    USER_EDIT_SAVED: 'admin_user_edit_saved',
    USER_CREATED: 'admin_user_created',
    USER_DELETED: 'admin_user_deleted',
    USER_SEARCHED: 'admin_user_searched',
    USER_FILTERED: 'admin_user_filtered',
    
    // Analytics events
    ANALYTICS_PAGE_VIEWED: 'admin_analytics_page_viewed',
    ANALYTICS_DATE_RANGE_CHANGED: 'admin_analytics_date_range_changed',
    
    // Settings events
    SETTINGS_PAGE_VIEWED: 'admin_settings_page_viewed',
    SETTINGS_UPDATED: 'admin_settings_updated',
    
    // Navigation events
    SIDEBAR_NAVIGATED: 'admin_sidebar_navigated',
    
    // Error events
    ERROR_OCCURRED: 'admin_error_occurred',
    API_ERROR: 'admin_api_error',
    
    // Performance events
    PAGE_LOAD_SLOW: 'admin_page_load_slow',
    CHART_LOAD_SLOW: 'admin_chart_load_slow',
} as const;

