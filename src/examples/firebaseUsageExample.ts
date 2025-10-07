/**
 * PRODUCTION-READY FIREBASE USAGE EXAMPLES
 * 
 * This file demonstrates how to safely use Firebase Realtime Database
 * with Telegram user data to avoid "Invalid token in path" errors.
 * 
 * COPY THESE PATTERNS TO YOUR PROJECT
 */

import { 
  sanitizeFirebasePath,
  createSafeUserPath,
  createSafeUserData,
  extractSafeUserId,
  createSafeFirebasePath 
} from '../utils/firebaseSanitizer';

import {
  initializeSafeFirebaseConnection,
  safeSet,
  safeGet,
  safeUpdate,
  safeCreateOrUpdateUser,
  setupSafeListener,
  testFirebaseConnection
} from '../firebase/safeConnection';

import { TelegramUser } from '../types/telegram';
import { User } from '../types/firebase';

/**
 * EXAMPLE 1: Safe Firebase Initialization
 * Always call this on app startup
 */
export const initializeFirebaseSafely = async (): Promise<boolean> => {
  try {
    console.log('🔥 Initializing Firebase with safe connection...');
    
    // Initialize connection with retry logic
    const connected = await initializeSafeFirebaseConnection();
    
    if (connected) {
      console.log('✅ Firebase connected successfully');
      
      // Test the connection
      const testPassed = await testFirebaseConnection();
      if (testPassed) {
        console.log('✅ Firebase connection test passed');
        return true;
      } else {
        console.error('❌ Firebase connection test failed');
        return false;
      }
    } else {
      console.error('❌ Failed to connect to Firebase');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
};

/**
 * EXAMPLE 2: Safe User Creation from Telegram Data
 * Use this pattern when creating users from Telegram WebApp
 */
export const createUserFromTelegramData = async (telegramUser: TelegramUser): Promise<User | null> => {
  try {
    console.log('🔒 Creating user from Telegram data safely...');
    
    // SAFE: Create sanitized user data
    const safeUserData = createSafeUserData(telegramUser, {
      coins: 1000,
      stars: 10,
      tier: 'free',
      // Add any additional default values
    });
    
    console.log('✅ Safe user data created:', {
      originalId: telegramUser.id,
      safeId: safeUserData.id,
      originalUsername: telegramUser.username,
      safeUsername: safeUserData.username
    });
    
    // SAFE: Save to Firebase using safe methods
    const success = await safeCreateOrUpdateUser(telegramUser.id, safeUserData);
    
    if (success) {
      console.log('✅ User created successfully in Firebase');
      return safeUserData;
    } else {
      console.error('❌ Failed to create user in Firebase');
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating user from Telegram data:', error);
    return null;
  }
};

/**
 * EXAMPLE 3: Safe User Data Reading
 * Use this to read user data safely
 */
export const getUserDataSafely = async (userId: string | number): Promise<User | null> => {
  try {
    console.log(`🔍 Reading user data safely for ID: ${userId}`);
    
    // SAFE: Extract and validate user ID
    const safeUserId = extractSafeUserId(userId);
    const userPath = createSafeFirebasePath('users', safeUserId);
    
    // SAFE: Read data using safe methods
    const userData = await safeGet(userPath);
    
    if (userData) {
      console.log(`✅ User data retrieved safely for ID: ${safeUserId}`);
      return userData as User;
    } else {
      console.log(`⚠️ No user data found for ID: ${safeUserId}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error reading user data:', error);
    return null;
  }
};

/**
 * EXAMPLE 4: Safe User Data Updates
 * Use this to update user data safely
 */
export const updateUserDataSafely = async (
  userId: string | number, 
  updates: Partial<User>
): Promise<boolean> => {
  try {
    console.log(`🔄 Updating user data safely for ID: ${userId}`);
    
    // SAFE: Sanitize the updates
    const sanitizedUpdates = {
      ...updates,
      username: updates.username ? sanitizeFirebasePath(updates.username) : undefined,
      firstName: updates.firstName ? sanitizeFirebasePath(updates.firstName) : undefined,
      lastName: updates.lastName ? sanitizeFirebasePath(updates.lastName) : undefined,
      lastActive: Date.now()
    };
    
    // Remove undefined values
    Object.keys(sanitizedUpdates).forEach(key => {
      if (sanitizedUpdates[key as keyof typeof sanitizedUpdates] === undefined) {
        delete sanitizedUpdates[key as keyof typeof sanitizedUpdates];
      }
    });
    
    // SAFE: Create safe path and update
    const safeUserId = extractSafeUserId(userId);
    const userPath = createSafeFirebasePath('users', safeUserId);
    
    const success = await safeUpdate(userPath, sanitizedUpdates);
    
    if (success) {
      console.log(`✅ User data updated safely for ID: ${safeUserId}`);
      return true;
    } else {
      console.error(`❌ Failed to update user data for ID: ${safeUserId}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating user data:', error);
    return false;
  }
};

/**
 * EXAMPLE 5: Safe Real-time Listeners
 * Use this to listen to user data changes safely
 */
export const listenToUserDataSafely = (
  userId: string | number,
  callback: (userData: User | null) => void,
  errorCallback?: (error: Error) => void
): (() => void) => {
  try {
    console.log(`👂 Setting up safe listener for user ID: ${userId}`);
    
    // SAFE: Create safe path
    const safeUserId = extractSafeUserId(userId);
    const userPath = createSafeFirebasePath('users', safeUserId);
    
    // SAFE: Setup listener with automatic cleanup
    const cleanup = setupSafeListener(
      userPath,
      (data) => {
        console.log(`📡 User data received safely for ID: ${safeUserId}`);
        callback(data as User | null);
      },
      (error) => {
        console.error(`❌ Listener error for user ID ${safeUserId}:`, error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
    
    console.log(`✅ Safe listener setup complete for user ID: ${safeUserId}`);
    return cleanup;
  } catch (error) {
    console.error('❌ Error setting up user listener:', error);
    if (errorCallback) {
      errorCallback(error as Error);
    }
    return () => {}; // Return empty cleanup function
  }
};

/**
 * EXAMPLE 6: Safe Task/Content Creation
 * Use this pattern for any user-generated content
 */
export const createUserContentSafely = async (
  userId: string | number,
  contentType: string,
  contentData: any
): Promise<string | null> => {
  try {
    console.log(`📝 Creating ${contentType} safely for user ID: ${userId}`);
    
    // SAFE: Create safe paths
    const safeUserId = extractSafeUserId(userId);
    const contentPath = createSafeFirebasePath(`user${contentType}`, safeUserId);
    
    // SAFE: Sanitize content data
    const sanitizedContent = {
      ...contentData,
      userId: safeUserId,
      createdAt: Date.now(),
      // Sanitize any string fields that might be used in paths
      title: contentData.title ? sanitizeFirebasePath(contentData.title) : undefined,
      description: contentData.description ? sanitizeFirebasePath(contentData.description) : undefined
    };
    
    // SAFE: Save content
    const contentId = `${contentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullPath = `${contentPath}/${contentId}`;
    
    const success = await safeSet(fullPath, sanitizedContent);
    
    if (success) {
      console.log(`✅ ${contentType} created safely with ID: ${contentId}`);
      return contentId;
    } else {
      console.error(`❌ Failed to create ${contentType}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error creating ${contentType}:`, error);
    return null;
  }
};

/**
 * EXAMPLE 7: Batch User Operations
 * Use this for admin operations or data migration
 */
export const batchUpdateUsersSafely = async (
  userUpdates: Array<{ userId: string | number; updates: Partial<User> }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  console.log(`🔄 Starting batch update for ${userUpdates.length} users...`);
  
  for (const { userId, updates } of userUpdates) {
    try {
      const updateSuccess = await updateUserDataSafely(userId, updates);
      if (updateSuccess) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Batch update failed for user ${userId}:`, error);
      failed++;
    }
  }
  
  console.log(`✅ Batch update complete: ${success} success, ${failed} failed`);
  return { success, failed };
};

/**
 * EXAMPLE 8: Error Recovery Pattern
 * Use this pattern to handle Firebase errors gracefully
 */
export const performFirebaseOperationWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  operationName: string = 'Firebase operation'
): Promise<T | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempting ${operationName} (${attempt}/${maxRetries})`);
      const result = await operation();
      console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.error(`❌ ${operationName} failed on attempt ${attempt}:`, error);
      
      // Check for specific Firebase path errors
      if (error instanceof Error && error.message.includes('Invalid token in path')) {
        console.error('🚨 CRITICAL: Invalid Firebase path detected!');
        console.error('🔍 This indicates unsanitized user data in Firebase paths');
        break; // Don't retry path errors
      }
      
      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
};

// Export all examples for easy use
export default {
  initializeFirebaseSafely,
  createUserFromTelegramData,
  getUserDataSafely,
  updateUserDataSafely,
  listenToUserDataSafely,
  createUserContentSafely,
  batchUpdateUsersSafely,
  performFirebaseOperationWithRetry
};