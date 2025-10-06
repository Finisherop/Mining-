// Farming Session Storage Utility
import { FarmingSession } from '../types';

const FARMING_SESSION_KEY = 'farming_session';
const LAST_CLAIM_KEY = 'last_daily_claim';

// Save farming session to localStorage
export const saveFarmingSession = (session: FarmingSession | null): void => {
  try {
    if (session) {
      localStorage.setItem(FARMING_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(FARMING_SESSION_KEY);
    }
  } catch (error) {
    console.error('Error saving farming session:', error);
  }
};

// Get farming session from localStorage
export const getFarmingSession = (): FarmingSession | null => {
  try {
    const data = localStorage.getItem(FARMING_SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading farming session:', error);
    return null;
  }
};

// Clear farming session
export const clearFarmingSession = (): void => {
  try {
    localStorage.removeItem(FARMING_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing farming session:', error);
  }
};

// Save last daily claim timestamp
export const saveLastDailyClaim = (timestamp: number): void => {
  try {
    localStorage.setItem(LAST_CLAIM_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error saving last daily claim:', error);
  }
};

// Get last daily claim timestamp
export const getLastDailyClaim = (): number | null => {
  try {
    const data = localStorage.getItem(LAST_CLAIM_KEY);
    return data ? parseInt(data) : null;
  } catch (error) {
    console.error('Error reading last daily claim:', error);
    return null;
  }
};

// Check if daily claim is available (24 hours passed)
export const isDailyClaimAvailable = (): boolean => {
  try {
    const lastClaim = getLastDailyClaim();
    if (!lastClaim) return true;
    
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return (now - lastClaim) >= twentyFourHours;
  } catch (error) {
    console.error('Error checking daily claim availability:', error);
    return true;
  }
};

// Get time remaining for next daily claim
export const getTimeUntilNextClaim = (): number => {
  try {
    const lastClaim = getLastDailyClaim();
    if (!lastClaim) return 0;
    
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const nextClaimTime = lastClaim + twentyFourHours;
    
    return Math.max(0, nextClaimTime - now);
  } catch (error) {
    console.error('Error calculating time until next claim:', error);
    return 0;
  }
};

// Format time remaining as readable string
export const formatTimeRemaining = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};