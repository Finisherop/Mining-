import { User } from '../types/firebase';

const USER_DATA_KEY = 'bot_user_data';
const LAST_SYNC_KEY = 'bot_last_sync';

// Get user data from localStorage
export const getUserFromStorage = (): User | null => {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Save user data to localStorage
export const saveUserToStorage = (user: User): void => {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Clear user data from localStorage
export const clearUserFromStorage = (): void => {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(LAST_SYNC_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Check if data needs sync (older than 5 minutes)
export const needsSync = (): boolean => {
  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (!lastSync) return true;
    
    const lastSyncTime = parseInt(lastSync);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (now - lastSyncTime) > fiveMinutes;
  } catch (error) {
    console.error('Error checking sync status:', error);
    return true;
  }
};

// Sync user data between localStorage and Firebase
export const syncUserData = async (
  userId: string,
  firebaseUser: User | null,
  updateFirebase: (userId: string, data: Partial<User>) => Promise<void>
): Promise<User | null> => {
  try {
    const localUser = getUserFromStorage();
    
    // If no data anywhere, return null
    if (!localUser && !firebaseUser) {
      return null;
    }
    
    // If only Firebase data exists, save to localStorage
    if (!localUser && firebaseUser) {
      saveUserToStorage(firebaseUser);
      return firebaseUser;
    }
    
    // If only local data exists, update Firebase
    if (localUser && !firebaseUser) {
      await updateFirebase(userId, localUser);
      return localUser;
    }
    
    // If both exist, use the most recent one
    if (localUser && firebaseUser) {
      const localLastActive = localUser.lastActive || 0;
      const firebaseLastActive = firebaseUser.lastActive || 0;
      
      if (localLastActive > firebaseLastActive) {
        // Local is newer, update Firebase
        await updateFirebase(userId, localUser);
        return localUser;
      } else {
        // Firebase is newer, update localStorage
        saveUserToStorage(firebaseUser);
        return firebaseUser;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error syncing user data:', error);
    const localUser = getUserFromStorage();
    return localUser || firebaseUser || null;
  }
};