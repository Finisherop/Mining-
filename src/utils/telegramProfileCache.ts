// Telegram Profile Cache Utility
interface CachedProfile {
  userId: number;
  photoUrl: string | null;
  fetchedAt: number;
  expiresAt: number;
}

const CACHE_KEY = 'telegram_profile_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const getCachedProfilePhoto = (userId: number): string | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const profiles: CachedProfile[] = JSON.parse(cached);
    const userProfile = profiles.find(p => p.userId === userId);
    
    if (!userProfile) return null;
    
    // Check if cache is still valid
    if (Date.now() > userProfile.expiresAt) {
      // Remove expired cache
      const updatedProfiles = profiles.filter(p => p.userId !== userId);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedProfiles));
      return null;
    }
    
    return userProfile.photoUrl;
  } catch (error) {
    console.error('Error reading profile cache:', error);
    return null;
  }
};

export const setCachedProfilePhoto = (userId: number, photoUrl: string | null): void => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    let profiles: CachedProfile[] = cached ? JSON.parse(cached) : [];
    
    // Remove existing cache for this user
    profiles = profiles.filter(p => p.userId !== userId);
    
    // Add new cache entry
    const newProfile: CachedProfile = {
      userId,
      photoUrl,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION
    };
    
    profiles.push(newProfile);
    
    // Keep only last 10 profiles to avoid storage bloat
    if (profiles.length > 10) {
      profiles = profiles.slice(-10);
    }
    
    localStorage.setItem(CACHE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Error setting profile cache:', error);
  }
};

export const clearProfileCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing profile cache:', error);
  }
};

export const isCacheExpired = (userId: number): boolean => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return true;

    const profiles: CachedProfile[] = JSON.parse(cached);
    const userProfile = profiles.find(p => p.userId === userId);
    
    if (!userProfile) return true;
    
    return Date.now() > userProfile.expiresAt;
  } catch (error) {
    console.error('Error checking cache expiry:', error);
    return true;
  }
};