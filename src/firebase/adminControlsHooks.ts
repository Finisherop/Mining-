// Admin Controls Firebase Hooks
import { useState, useEffect } from 'react';
import { ref, get, set, onValue, off, update, push } from 'firebase/database';
import { database } from './config';
import { SystemSettings, AdminAction } from '../types/adminControls';

// Default system settings
const defaultSettings: SystemSettings = {
  farmingRates: { free: 10, bronze: 15, diamond: 20 },
  farmingMultipliers: { free: 1, bronze: 2, diamond: 2.5 },
  taskRewards: {
    daily: 25,
    weekly: 100,
    youtube: 50,
    telegram: 30,
    website: 20,
    ads: 5
  },
  conversionRates: {
    coinsToINR: 100, // 100 coins = 1 INR
    starsToINR: 10   // 10 stars = 1 INR
  },
  withdrawalLimits: {
    free: { min: 200, max: 1000, daily: 1 },
    bronze: { min: 100, max: 2000, daily: 3 },
    diamond: { min: 200, max: 5000, daily: 5 }
  },
  vipPricing: {
    bronze: { stars: 75, inr: 750, duration: 30 },
    diamond: { stars: 150, inr: 1500, duration: 30 }
  },
  referralRewards: { free: 10, bronze: 15, diamond: 25 },
  adsSettings: {
    dailyLimit: 10,
    rewardPerAd: 5,
    adDuration: 30,
    vipUnlimited: true
  },
  maintenanceMode: false,
  registrationOpen: true,
  lastUpdated: Date.now(),
  updatedBy: 'system'
};

// Hook for system settings
export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = ref(database, 'systemSettings');
    
    const unsubscribe = onValue(settingsRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
      try {
        if (snapshot.exists()) {
          setSettings({ ...defaultSettings, ...snapshot.val() });
        } else {
          setSettings(defaultSettings);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err: any) => { // <-- ERROR FIX: Add explicit type for Firebase error callback
      setError(err.message);
      setLoading(false);
    });

    return () => off(settingsRef, 'value', unsubscribe);
  }, []);

  return { settings, loading, error };
};

// Update system settings
export const updateSystemSettings = async (
  updates: Partial<SystemSettings>,
  adminId: string
): Promise<boolean> => {
  try {
    const settingsRef = ref(database, 'systemSettings');
    
    const updatedSettings = {
      ...updates,
      lastUpdated: Date.now(),
      updatedBy: adminId
    };
    
    await update(settingsRef, updatedSettings);
    
    // ERROR FIX: Fix union type for admin action
    // Log admin action
    await logAdminAction({
      adminId,
      action: 'settings_update', // <-- fix union type to match AdminAction interface
      targetId: 'system',
      details: updates
    });
    
    console.log('✅ System settings updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating system settings:', error);
    return false;
  }
};

// Log admin actions
export const logAdminAction = async (actionData: Omit<AdminAction, 'id' | 'timestamp'>): Promise<string | null> => {
  try {
    const actionsRef = ref(database, 'adminActions');
    const newActionRef = push(actionsRef);
    
    const action: AdminAction = {
      ...actionData,
      id: newActionRef.key!,
      timestamp: Date.now()
    };
    
    await set(newActionRef, action);
    return newActionRef.key;
  } catch (error) {
    console.error('❌ Error logging admin action:', error);
    return null;
  }
};

// Hook for admin actions log
export const useAdminActions = (limit: number = 50) => {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const actionsRef = ref(database, 'adminActions');
    
    const unsubscribe = onValue(actionsRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
      try {
        if (snapshot.exists()) {
          const actionsData = snapshot.val();
          const actionsList = Object.values(actionsData) as AdminAction[];
          
          // Sort by timestamp descending and limit results
          const sortedActions = actionsList
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
          
          setActions(sortedActions);
        } else {
          setActions([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err: any) => { // <-- ERROR FIX: Add explicit type for Firebase error callback
      setError(err.message);
      setLoading(false);
    });

    return () => off(actionsRef, 'value', unsubscribe);
  }, [limit]);

  return { actions, loading, error };
};

// Calculate conversion rates
export const calculateCoinsToINR = (coins: number, rate: number): number => {
  return Math.floor(coins / rate);
};

export const calculateINRToCoins = (inr: number, rate: number): number => {
  return inr * rate;
};

export const calculateStarsToINR = (stars: number, rate: number): number => {
  return Math.floor(stars / rate);
};

// Initialize system settings if not exists
export const initializeSystemSettings = async (): Promise<boolean> => {
  try {
    const settingsRef = ref(database, 'systemSettings');
    const snapshot = await get(settingsRef);
    
    if (!snapshot.exists()) {
      await set(settingsRef, defaultSettings);
      console.log('✅ System settings initialized');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
    return false;
  }
};