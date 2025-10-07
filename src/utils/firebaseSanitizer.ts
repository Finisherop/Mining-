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
 * Sanitize Telegram username for Firebase (when needed as secondary reference)
 * Note: Always prefer numeric ID over username for primary keys
 * 
 * @param username - Telegram username
 * @returns Sanitized username safe for Firebase
 */
export const sanitizeTelegramUsername = (username: string | null | undefined): string => {
  if (!username) {
    return 'no_username';
  }
  
  // Remove @ symbol if present and sanitize
  const cleanUsername = username.replace(/^@/, '');
  return sanitizeFirebasePath(cleanUsername) || 'invalid_username';
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
    username: sanitizeTelegramUsername(telegramUser.username) || `user_${safeUserId}`,
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

/**
 * Validate Firebase path safety
 * Use this to double-check paths before database operations
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
 * Safe Firebase reference creator with validation
 * Always use this instead of direct ref() calls with user data
 * 
 * @param basePath - Base path (e.g., 'users', 'tasks')
 * @param identifier - User identifier or other path component
 * @returns Safe Firebase path
 */
export const createSafeFirebasePath = (basePath: string, identifier: string | number): string => {
  const safeIdentifier = typeof identifier === 'number' 
    ? identifier.toString() 
    : sanitizeFirebasePath(identifier);
  
  const fullPath = `${basePath}/${safeIdentifier}`;
  
  // Validate the final path
  if (!isFirebasePathSafe(fullPath)) {
    console.error('🚨 Generated unsafe Firebase path:', fullPath);
    throw new Error(`Unsafe Firebase path: ${fullPath}`);
  }
  
  return fullPath;
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
 * Batch sanitize multiple user records
 * Useful for admin operations or data migration
 * 
 * @param users - Array of user records to sanitize
 * @returns Array of sanitized user records
 */
export const batchSanitizeUsers = (users: any[]): User[] => {
  return users.map(user => {
    if (!user.id && !user.userId) {
      console.warn('⚠️ User missing ID, skipping:', user);
      return null;
    }
    
    try {
      return createSafeUserData(user, user);
    } catch (error) {
      console.error('❌ Failed to sanitize user:', user, error);
      return null;
    }
  }).filter(Boolean) as User[];
};

/**
 * Debug utility to check existing Firebase paths
 * Use this to identify problematic paths in your database
 * 
 * @param paths - Array of paths to check
 * @returns Report of safe/unsafe paths
 */
export const auditFirebasePaths = (paths: string[]): {
  safe: string[];
  unsafe: string[];
  report: string;
} => {
  const safe: string[] = [];
  const unsafe: string[] = [];
  
  paths.forEach(path => {
    if (isFirebasePathSafe(path)) {
      safe.push(path);
    } else {
      unsafe.push(path);
    }
  });
  
  const report = `
Firebase Path Audit Report:
✅ Safe paths: ${safe.length}
❌ Unsafe paths: ${unsafe.length}
${unsafe.length > 0 ? '\nUnsafe paths:\n' + unsafe.map(p => `  - ${p}`).join('\n') : ''}
  `;
  
  console.log(report);
  return { safe, unsafe, report };
};

// Export commonly used functions for easy access
export default {
  sanitizeFirebasePath,
  createSafeUserPath,
  sanitizeTelegramUsername,
  createSafeUserData,
  isFirebasePathSafe,
  createSafeFirebasePath,
  extractSafeUserId,
  batchSanitizeUsers,
  auditFirebasePaths
};