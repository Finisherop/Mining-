// Comprehensive Data Synchronization Utility
import { User } from '../types/firebase';
import { createOrUpdateUser } from '../firebase/hooks';

const USER_DATA_KEY = 'user_data_v2';
const LAST_SYNC_KEY = 'last_sync_v2';
const SYNC_INTERVAL = 30 * 1000; // 30 seconds

// Save user data to localStorage
export const saveUserToLocalStorage = (user: User): void => {
  try {
    const userData = {
      ...user,
      lastUpdated: Date.now()
    };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.log('💾 User data saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving user to localStorage:', error);
  }
};

// Get user data from localStorage
export const getUserFromLocalStorage = (): User | null => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (!data) return null;
    
    const userData = JSON.parse(data);
    console.log('📱 User data loaded from localStorage');
    return userData;
  } catch (error) {
    console.error('❌ Error reading user from localStorage:', error);
    return null;
  }
};

// Clear localStorage data
export const clearLocalStorage = (): void => {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
    console.log('🗑️ localStorage cleared');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
};

// Check if sync is needed
export const needsSync = (): boolean => {
  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (!lastSync) return true;
    
    const timeSinceSync = Date.now() - parseInt(lastSync);
    return timeSinceSync > SYNC_INTERVAL;
  } catch (error) {
    console.error('❌ Error checking sync status:', error);
    return true;
  }
};

// Sync user data between localStorage and Firebase
export const syncUserData = async (
  userId: string,
  localUser: User | null,
  firebaseUser: User | null,
  forceSync: boolean = false
): Promise<User | null> => {
  try {
    console.log('🔄 Starting data sync...');
    
    // If no data exists anywhere
    if (!localUser && !firebaseUser) {
      console.log('⚠️ No user data found');
      return null;
    }
    
    // If only Firebase data exists
    if (!localUser && firebaseUser) {
      console.log('📥 Using Firebase data, saving to localStorage');
      saveUserToLocalStorage(firebaseUser);
      return firebaseUser;
    }
    
    // If only local data exists
    if (localUser && !firebaseUser) {
      console.log('📤 Using local data, saving to Firebase');
      await createOrUpdateUser(userId, localUser);
      return localUser;
    }
    
    // If both exist, use the most recent one
    if (localUser && firebaseUser) {
      const localTime = localUser.lastActive || 0;
      const firebaseTime = firebaseUser.lastActive || 0;
      
      if (forceSync || localTime > firebaseTime) {
        console.log('📤 Local data is newer, updating Firebase');
        await createOrUpdateUser(userId, localUser);
        return localUser;
      } else {
        console.log('📥 Firebase data is newer, updating localStorage');
        saveUserToLocalStorage(firebaseUser);
        return firebaseUser;
      }
    }
    
    return localUser || firebaseUser;
  } catch (error) {
    console.error('❌ Error syncing user data:', error);
    // Return local data as fallback
    return localUser || firebaseUser || null;
  }
};

// Auto-sync user data with debouncing
let syncTimeout: NodeJS.Timeout | null = null;

export const autoSyncUserData = async (user: User): Promise<void> => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(async () => {
    try {
      saveUserToLocalStorage(user);
      await createOrUpdateUser(user.userId, user);
      console.log('✅ Auto-sync completed');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    }
  }, 1000); // 1 second debounce
};

// Force sync all data
export const forceSyncData = async (userId: string): Promise<User | null> => {
  try {
    const localUser = getUserFromLocalStorage();
    // Force fetch from Firebase
    // const { useFirebaseUser } = await import('../firebase/hooks');
    
    // This is a simplified version - in real implementation you'd need to handle this differently
    console.log('🔄 Force syncing data...');
    
    if (localUser) {
      await createOrUpdateUser(userId, localUser);
      return localUser;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Force sync failed:', error);
    return null;
  }
};