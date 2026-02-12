/**
 * Clarity Integration Guide for Cats Game App
 * 
 * This file contains example code for integrating Microsoft Clarity
 * into your Cats Game application to track user behavior.
 * 
 * Copy and adapt this code to your game app.
 */

import Clarity from '@microsoft/clarity';

// Initialize Clarity when your app starts
export function initClarityForGame(projectId: string) {
    if (typeof window !== 'undefined' && projectId) {
        Clarity.init(projectId);
        console.log('Clarity initialized for game tracking');
    }
}

/**
 * Identify a player when they log in or start playing
 * This links Clarity sessions to your game users
 */
export function identifyPlayer(
    userId: string,
    userName: string,
    playerLevel?: number,
    totalXP?: number
) {
    if (typeof window !== 'undefined') {
        const sessionId = `game-${userId}-${Date.now()}`;
        const pageId = window.location.pathname || 'game-home';
        
        Clarity.identify(
            userId,        // User ID (will be hashed by Clarity)
            sessionId,     // Game session ID
            pageId,        // Current game screen
            userName       // Player name
        );

        // Set player attributes as tags for filtering
        if (playerLevel !== undefined) {
            Clarity.setTag('player_level', playerLevel.toString());
        }
        if (totalXP !== undefined) {
            Clarity.setTag('total_xp', totalXP.toString());
        }
        Clarity.setTag('game_type', 'cats-game');
    }
}

/**
 * Track game events - call these when important actions happen
 */
export const GameEvents = {
    // Gameplay events
    LEVEL_STARTED: 'level_started',
    LEVEL_COMPLETED: 'level_completed',
    LEVEL_FAILED: 'level_failed',
    
    // Progression events
    XP_EARNED: 'xp_earned',
    LEVEL_UP: 'level_up',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    
    // Engagement events
    VIDEO_WATCHED: 'video_watched',
    PURCHASE_MADE: 'purchase_made',
    REWARD_CLAIMED: 'reward_claimed',
    
    // Feature usage
    FEATURE_OPENED: 'feature_opened',
    SETTINGS_CHANGED: 'settings_changed',
    PROFILE_VIEWED: 'profile_viewed',
    
    // Error events
    ERROR_OCCURRED: 'error_occurred',
    GAME_CRASHED: 'game_crashed',
} as const;

/**
 * Track a game event
 */
export function trackGameEvent(eventName: string, metadata?: Record<string, string>) {
    if (typeof window !== 'undefined') {
        Clarity.event(eventName);
        
        // Add metadata as tags
        if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
                Clarity.setTag(key, value);
            });
        }
    }
}

/**
 * Track level completion with details
 */
export function trackLevelCompletion(level: number, score: number, timeSpent: number) {
    trackGameEvent(GameEvents.LEVEL_COMPLETED, {
        level: level.toString(),
        score: score.toString(),
        time_spent: timeSpent.toString(),
    });
}

/**
 * Track XP earned
 */
export function trackXPEarned(amount: number, source: string) {
    trackGameEvent(GameEvents.XP_EARNED, {
        amount: amount.toString(),
        source: source,
    });
}

/**
 * Track video watched
 */
export function trackVideoWatched(videoId: string, duration: number) {
    trackGameEvent(GameEvents.VIDEO_WATCHED, {
        video_id: videoId,
        duration: duration.toString(),
    });
}

/**
 * Track purchase
 */
export function trackPurchase(itemId: string, amount: number, currency: string) {
    trackGameEvent(GameEvents.PURCHASE_MADE, {
        item_id: itemId,
        amount: amount.toString(),
        currency: currency,
    });
    
    // Upgrade session for high-value actions
    Clarity.upgrade('purchase_made');
}

/**
 * Track errors
 */
export function trackError(errorType: string, errorMessage: string, context?: Record<string, string>) {
    trackGameEvent(GameEvents.ERROR_OCCURRED, {
        error_type: errorType,
        error_message: errorMessage.substring(0, 100), // Limit length
        ...context,
    });
}

/**
 * Example integration in a React component:
 * 
 * ```tsx
 * import { useEffect } from 'react';
 * import { initClarityForGame, identifyPlayer, trackGameEvent, GameEvents } from '@/lib/clarity-game-integration';
 * 
 * function GameApp() {
 *     useEffect(() => {
 *         // Initialize Clarity
 *         const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
 *         if (projectId) {
 *             initClarityForGame(projectId);
 *         }
 *     }, []);
 * 
 *     useEffect(() => {
 *         // Identify player when they log in
 *         if (user) {
 *             identifyPlayer(
 *                 user.id,
 *                 user.name,
 *                 user.level,
 *                 user.totalXP
 *             );
 *         }
 *     }, [user]);
 * 
 *     const handleLevelComplete = () => {
 *         trackGameEvent(GameEvents.LEVEL_COMPLETED, {
 *             level: currentLevel.toString(),
 *         });
 *     };
 * 
 *     return <div>Your game UI</div>;
 * }
 * ```
 */

