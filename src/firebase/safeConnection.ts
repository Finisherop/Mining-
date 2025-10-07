/**
 * Safe Firebase Connection Manager
 * Handles safe database operations with path validation and retry logic
 */

import { ref, get, set, update, DatabaseReference } from 'firebase/database';
import { database } from './config';
import { isFirebasePathSafe, extractSafeUserId } from '../utils/firebaseSanitizer';

/**
 * Create safe Firebase reference with path validation
 */
export const createSafeRef = (path: string): DatabaseReference => {
  if (!isFirebasePathSafe(path)) {
    throw new Error(`Unsafe Firebase path: ${path}`);
  }
  return ref(database, path);
};

/**
 * Safe database write with retry logic
 */
export const safeSet = async (path: string, data: any, retries: number = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const safeRef = createSafeRef(path);
      await set(safeRef, data);
      console.log(`✅ Firebase write successful: ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Firebase write attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return false;
};

/**
 * Safe database read with retry logic
 */
export const safeGet = async (path: string, retries: number = 3): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const safeRef = createSafeRef(path);
      const snapshot = await get(safeRef);
      console.log(`✅ Firebase read successful: ${path}`);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error(`❌ Firebase read attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return null;
};

/**
 * Safe user creation/update with sanitized data
 */
export const safeCreateOrUpdateUser = async (
  userId: string | number, 
  userData: any
): Promise<boolean> => {
  try {
    const safeUserId = extractSafeUserId(userId);
    const userPath = `users/${safeUserId}`;
    
    // Sanitize user data
    const sanitizedData = {
      ...userData,
      id: safeUserId,
      userId: safeUserId,
      lastActive: Date.now()
    };
    
    return await safeSet(userPath, sanitizedData);
  } catch (error) {
    console.error('❌ Failed to create/update user:', error);
    throw error;
  }
};