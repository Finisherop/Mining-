/**
 * Safe Firebase Realtime Database Connection Manager
 * 
 * Handles connection initialization, retries, and safe database operations
 * with comprehensive error handling and path sanitization
 */

import { ref, get, set, update, push, onValue, off, DatabaseReference } from 'firebase/database';
import { database } from './config';
import { 
  sanitizeFirebasePath, 
  createSafeUserPath, 
  createSafeFirebasePath,
  isFirebasePathSafe,
  extractSafeUserId 
} from '../utils/firebaseSanitizer';
import { User } from '../types/firebase';

/**
 * Connection state management
 */
interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  retryCount: number;
  lastError: Error | null;
  lastConnected: number | null;
}

let connectionState: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  retryCount: 0,
  lastError: null,
  lastConnected: null
};

/**
 * Connection event listeners
 */
const connectionListeners: Array<(connected: boolean) => void> = [];

/**
 * Add connection state listener
 */
export const addConnectionListener = (callback: (connected: boolean) => void): void => {
  connectionListeners.push(callback);
};

/**
 * Remove connection state listener
 */
export const removeConnectionListener = (callback: (connected: boolean) => void): void => {
  const index = connectionListeners.indexOf(callback);
  if (index > -1) {
    connectionListeners.splice(index, 1);
  }
};

/**
 * Notify all listeners of connection state change
 */
const notifyConnectionListeners = (connected: boolean): void => {
  connectionListeners.forEach(callback => {
    try {
      callback(connected);
    } catch (error) {
      console.error('❌ Connection listener error:', error);
    }
  });
};

/**
 * Initialize Firebase connection with retry logic
 * Call this on app startup to establish connection
 */
export const initializeSafeFirebaseConnection = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (connectionState.isConnected) {
      resolve(true);
      return;
    }

    if (connectionState.isConnecting) {
      // Already connecting, wait for result
      const checkConnection = () => {
        if (connectionState.isConnected) {
          resolve(true);
        } else if (!connectionState.isConnecting) {
          resolve(false);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
      return;
    }

    connectionState.isConnecting = true;
    console.log('🔥 Initializing safe Firebase connection...');

    try {
      // Monitor connection state
      const connectedRef = ref(database, '.info/connected');
      
      onValue(connectedRef, (snapshot) => {
        const connected = snapshot.val() === true;
        
        if (connected) {
          console.log('✅ Firebase connected successfully');
          connectionState.isConnected = true;
          connectionState.isConnecting = false;
          connectionState.retryCount = 0;
          connectionState.lastError = null;
          connectionState.lastConnected = Date.now();
          
          notifyConnectionListeners(true);
          resolve(true);
        } else {
          console.log('❌ Firebase disconnected');
          connectionState.isConnected = false;
          
          // Only set connecting to false if we're not in a retry cycle
          if (!connectionState.isConnecting) {
            notifyConnectionListeners(false);
          }
        }
      }, (error) => {
        console.error('❌ Firebase connection error:', error);
        connectionState.isConnected = false;
        connectionState.isConnecting = false;
        connectionState.lastError = error;
        
        // Retry connection with exponential backoff
        retryConnection();
        resolve(false);
      });

    } catch (error) {
      console.error('❌ Failed to initialize Firebase connection:', error);
      connectionState.isConnecting = false;
      connectionState.lastError = error as Error;
      resolve(false);
    }
  });
};

/**
 * Retry connection with exponential backoff
 */
const retryConnection = (): void => {
  if (connectionState.retryCount >= 5) {
    console.error('❌ Max Firebase connection retries reached');
    connectionState.isConnecting = false;
    notifyConnectionListeners(false);
    return;
  }

  connectionState.retryCount++;
  const delay = Math.min(1000 * Math.pow(2, connectionState.retryCount - 1), 30000);
  
  console.log(`🔄 Retrying Firebase connection in ${delay}ms (attempt ${connectionState.retryCount}/5)`);
  
  setTimeout(() => {
    initializeSafeFirebaseConnection();
  }, delay);
};

/**
 * Get current connection state
 */
export const getConnectionState = (): ConnectionState => {
  return { ...connectionState };
};

/**
 * Safe database reference creator
 * Always validates paths before creating references
 */
export const createSafeRef = (path: string): DatabaseReference => {
  if (!isFirebasePathSafe(path)) {
    throw new Error(`Unsafe Firebase path: ${path}`);
  }
  
  return ref(database, path);
};

/**
 * Safe user reference creator
 * Always use this for user-related database operations
 */
export const createSafeUserRef = (userId: string | number): DatabaseReference => {
  const safeUserId = extractSafeUserId(userId);
  const safePath = createSafeFirebasePath('users', safeUserId);
  return createSafeRef(safePath);
};

/**
 * Safe database write operation with retry logic
 */
export const safeSet = async (
  path: string, 
  data: any, 
  retries: number = 3
): Promise<boolean> => {
  if (!connectionState.isConnected) {
    console.warn('⚠️ Firebase not connected, attempting to reconnect...');
    await initializeSafeFirebaseConnection();
  }

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
      
      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

/**
 * Safe database read operation with retry logic
 */
export const safeGet = async (
  path: string, 
  retries: number = 3
): Promise<any> => {
  if (!connectionState.isConnected) {
    console.warn('⚠️ Firebase not connected, attempting to reconnect...');
    await initializeSafeFirebaseConnection();
  }

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
      
      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
};

/**
 * Safe database update operation
 */
export const safeUpdate = async (
  path: string, 
  updates: any, 
  retries: number = 3
): Promise<boolean> => {
  if (!connectionState.isConnected) {
    console.warn('⚠️ Firebase not connected, attempting to reconnect...');
    await initializeSafeFirebaseConnection();
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const safeRef = createSafeRef(path);
      await update(safeRef, updates);
      console.log(`✅ Firebase update successful: ${path}`);
      return true;
    } catch (error) {
      console.error(`❌ Firebase update attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

/**
 * Safe user creation/update with sanitized data
 */
export const safeCreateOrUpdateUser = async (
  userId: string | number, 
  userData: Partial<User>
): Promise<boolean> => {
  try {
    const safeUserId = extractSafeUserId(userId);
    const userPath = createSafeFirebasePath('users', safeUserId);
    
    // Sanitize user data before saving
    const sanitizedData = {
      ...userData,
      id: safeUserId,
      userId: safeUserId,
      username: userData.username ? sanitizeFirebasePath(userData.username) : undefined,
      firstName: userData.firstName ? sanitizeFirebasePath(userData.firstName) : undefined,
      lastName: userData.lastName ? sanitizeFirebasePath(userData.lastName) : undefined,
      lastActive: Date.now()
    };
    
    // Remove undefined values
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key as keyof typeof sanitizedData] === undefined) {
        delete sanitizedData[key as keyof typeof sanitizedData];
      }
    });
    
    return await safeSet(userPath, sanitizedData);
  } catch (error) {
    console.error('❌ Failed to create/update user:', error);
    throw error;
  }
};

/**
 * Safe user data retrieval
 */
export const safeGetUser = async (userId: string | number): Promise<User | null> => {
  try {
    const safeUserId = extractSafeUserId(userId);
    const userPath = createSafeFirebasePath('users', safeUserId);
    
    const userData = await safeGet(userPath);
    return userData as User | null;
  } catch (error) {
    console.error('❌ Failed to get user:', error);
    throw error;
  }
};

/**
 * Safe listener setup with automatic cleanup
 */
export const setupSafeListener = (
  path: string,
  callback: (data: any) => void,
  errorCallback?: (error: Error) => void
): () => void => {
  const safeRef = createSafeRef(path);
  
  const unsubscribe = onValue(safeRef, (snapshot) => {
    try {
      const data = snapshot.exists() ? snapshot.val() : null;
      callback(data);
    } catch (error) {
      console.error('❌ Listener callback error:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
    }
  }, (error) => {
    console.error('❌ Firebase listener error:', error);
    if (errorCallback) {
      errorCallback(error);
    }
  });
  
  // Return cleanup function
  return () => {
    off(safeRef, 'value', unsubscribe);
  };
};

/**
 * Test Firebase connection
 * Use this to verify connection is working
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Test write
    const testPath = 'connectionTest/test';
    const testData = { timestamp: Date.now(), test: true };
    
    await safeSet(testPath, testData);
    console.log('✅ Firebase write test passed');
    
    // Test read
    const readData = await safeGet(testPath);
    if (readData && readData.test === true) {
      console.log('✅ Firebase read test passed');
      
      // Cleanup test data
      await safeSet(testPath, null);
      console.log('✅ Firebase connection test completed successfully');
      return true;
    } else {
      console.error('❌ Firebase read test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Export connection utilities
export default {
  initializeSafeFirebaseConnection,
  getConnectionState,
  addConnectionListener,
  removeConnectionListener,
  createSafeRef,
  createSafeUserRef,
  safeSet,
  safeGet,
  safeUpdate,
  safeCreateOrUpdateUser,
  safeGetUser,
  setupSafeListener,
  testFirebaseConnection
};