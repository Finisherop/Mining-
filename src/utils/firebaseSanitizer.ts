/**
 * Firebase Realtime Database Path Sanitizer
 * 
 * Firebase paths cannot contain: . $ # [ ] /
 * This utility sanitizes Telegram user data to create safe database paths
 * 
 * CRITICAL: Always use numeric Telegram user ID as primary key for maximum safety
 */

import { TelegramUser } from '../types/telegram';
import { User } from '../types/firebase';

/**
 * Sanitize any string to be safe for Firebase paths
 * Replaces invalid characters: . $ # [ ] / with underscore _
 * 
 * @param input - String to sanitize
 * @returns Safe string for Firebase paths
 */
export const sanitizeFirebasePath = (input: string | null | undefined): string => {
  if (!input || typeof input !== 'string') {
    return 'unknown';
  }
  
  // Replace all invalid Firebase path characters with underscore
  // Firebase invalid chars: . $ # [ ] /
  return input
    .replace(/[\.\$\#\[\]\/]/g, '_')  // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_')           // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')         // Remove leading/trailing underscores
    .trim()                          // Remove whitespace
    || 'unknown';                    // Fallback if empty after sanitization
};

/**
 * Create safe Firebase user path using numeric Telegram ID
 * ALWAYS use this for user references - numeric IDs are safest
 * 
 * @param telegramId - Telegram user ID (numeric)
 * @returns Safe Firebase path for user
 */
export const createSafeUserPath = (telegramId: string | number): string => {
  const numericId = typeof telegramId === 'string' ? telegramId : telegramId.toString();
  
  // Validate it's actually numeric
  if (!/^\d+$/.test(numericId)) {
    console.warn('⚠️ Non-numeric Telegram ID detected:', telegramId);
    return `user_${sanitizeFirebasePath(numericId)}`;
  }
  
  return numericId; // Numeric IDs are always safe for Firebase
};

/**
 * Extract safe user ID from various input formats
 * Handles both string and number inputs safely
 * 
 * @param input - User ID in various formats
 * @returns Safe numeric user ID string
 */
export const extractSafeUserId = (input: string | number | null | undefined): string => {
  if (!input) {
    throw new Error('User ID is required');
  }
  
  const stringId = input.toString();
  
  // Validate it's numeric (Telegram IDs are always numeric)
  if (!/^\d+$/.test(stringId)) {
    console.warn('⚠️ Non-numeric user ID, sanitizing:', input);
    return sanitizeFirebasePath(stringId);
  }
  
  return stringId;
};

/**
 * Create safe Firebase path for any resource
 * 
 * @param basePath - Base path (e.g., 'users', 'tasks')
 * @param identifier - Resource identifier
 * @returns Safe Firebase path
 */
export const createSafeFirebasePath = (basePath: string, identifier: string | number): string => {
  const safeIdentifier = typeof identifier === 'number' 
    ? identifier.toString() 
    : sanitizeFirebasePath(identifier);
  
  return `${basePath}/${safeIdentifier}`;
};

/**
 * Validate Firebase path safety
 * 
 * @param path - Firebase path to validate
 * @returns true if path is safe, false otherwise
 */
export const isFirebasePathSafe = (path: string): boolean => {
  // Check for invalid characters
  const invalidChars = /[\.\$\#\[\]\/]/;
  
  if (invalidChars.test(path)) {
    console.error('🚨 Unsafe Firebase path detected:', path);
    return false;
  }
  
  return true;
};

/**
 * Create comprehensive safe user data for Firebase storage
 * Sanitizes all string fields that might be used in paths or cause issues
 * 
 * @param telegramUser - Raw Telegram user data
 * @param additionalData - Additional user data to merge
 * @returns Sanitized user data safe for Firebase
 */
export const createSafeUserData = (
  telegramUser: TelegramUser, 
  additionalData: Partial<User> = {}
): User => {
  const safeUserId = createSafeUserPath(telegramUser.id);
  
  return {
    // Core identifiers - use numeric ID as primary key
    id: safeUserId,
    userId: safeUserId,
    
    // Sanitized text fields
    username: sanitizeFirebasePath(telegramUser.username) || `user_${safeUserId}`,
    firstName: sanitizeFirebasePath(telegramUser.first_name) || 'User',
    lastName: sanitizeFirebasePath(telegramUser.last_name) || '',
    
    // Safe defaults
    coins: additionalData.coins || 1000,
    stars: additionalData.stars || 10,
    tier: additionalData.tier || 'free',
    vipType: additionalData.vipType || 'free',
    vipExpiry: additionalData.vipExpiry || null,
    dailyWithdrawals: additionalData.dailyWithdrawals || 0,
    referralCode: additionalData.referralCode || `REF${safeUserId.slice(-6)}`,
    totalReferrals: additionalData.totalReferrals || 0,
    farmingRate: additionalData.farmingRate || 10,
    claimStreak: additionalData.claimStreak || 0,
    claimedDays: additionalData.claimedDays || [],
    badges: additionalData.badges || [],
    createdAt: additionalData.createdAt || Date.now(),
    lastActive: Date.now(),
    totalEarnings: additionalData.totalEarnings || 0,
    isVIP: additionalData.isVIP || false,
    banned: additionalData.banned || false,
    earningMultiplier: additionalData.earningMultiplier || 1,
    boosts: additionalData.boosts || 0,
    referralCount: additionalData.referralCount || 0,
    vip_tier: additionalData.vip_tier || 'free',
    vip_expiry: additionalData.vip_expiry || null,
    multiplier: additionalData.multiplier || 1,
    withdraw_limit: additionalData.withdraw_limit || 1,
    referral_boost: additionalData.referral_boost || 1,
    
    // Optional fields
    photo_url: telegramUser.photo_url || additionalData.photo_url
  };
};

// Export commonly used functions
export default {
  sanitizeFirebasePath,
  createSafeUserPath,
  extractSafeUserId,
  createSafeFirebasePath,
  isFirebasePathSafe,
  createSafeUserData
};