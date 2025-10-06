// Admin Controls Firebase Hooks
import { useState, useEffect } from 'react';
import { ref, get, set, onValue, off, update } from 'firebase/database';
import { database } from './config';
import { AdminSettings, AdminAction } from '../types/adminControls';

// Default admin settings
const defaultSettings: AdminSettings = {
  farming: {
    baseRate: 10, // 10 coins per minute
    maxDuration: 8, // 8 hours max
    cooldownTime: 60 // 1 hour cooldown
  },
  taskRewards: {
    daily: 25,
    weekly: 100,
    youtube: 50,
    telegram: 30,
    website: 20,
    ads: 5
  },
  conversion: {
    coinsToInr: 100, // 100 coins = 1 INR
    starsToInr: 10, // 10 stars = 1 INR
    adsReward: 5 // 5 coins per ad
  },
  withdrawal: {
    minAmounts: {
      free: 200,
      bronze: 100,
      diamond: 50
    },
    dailyLimits: {
      free: 1,
      bronze: 3,
      diamond: 5
    },
    processingFee: 0 // 0% processing fee
  },
  vip: {
    prices: {
      bronze: 75,
      diamond: 150
    },
    duration: 30, // 30 days
    multipliers: {
      bronze: 2,
      diamond: 2.5
    }
  },
  system: {
    maintenanceMode: false,
    maxUsersPerDay: 1000,
    referralBonus: 50,
    dailyClaimCooldown: 24 // 24 hours
  }
};

// Hook for admin settings
export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const settingsRef = ref(database, 'adminSettings');
    
    const unsubscribe = onValue(settingsRef, (snapshot) => {
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
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(settingsRef, 'value', unsubscribe);
  }, []);

  return { settings, loading, error };
};

// Update admin settings
export const updateAdminSettings = async (
  updates: Partial<AdminSettings>
): Promise<boolean> => {
  try {
    const settingsRef = ref(database, 'adminSettings');
    await update(settingsRef, updates);
    
    console.log('✅ Admin settings updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating admin settings:', error);
    return false;
  }
};

// Log admin action
export const logAdminAction = async (action: Omit<AdminAction, 'id'>): Promise<boolean> => {
  try {
    const actionsRef = ref(database, 'adminActions');
    const actionId = `${action.adminId}_${Date.now()}`;
    
    const adminAction: AdminAction = {
      ...action,
      id: actionId
    };
    
    await set(ref(database, `adminActions/${actionId}`), adminAction);
    
    console.log('✅ Admin action logged:', action.action);
    return true;
  } catch (error) {
    console.error('❌ Error logging admin action:', error);
    return false;
  }
};

// Get conversion rate
export const getConversionRate = async (
  type: 'coinsToInr' | 'starsToInr'
): Promise<number> => {
  try {
    const settingsRef = ref(database, `adminSettings/conversion/${type}`);
    const snapshot = await get(settingsRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return defaultSettings.conversion[type];
  } catch (error) {
    console.error('❌ Error getting conversion rate:', error);
    return defaultSettings.conversion[type];
  }
};

// Update specific setting
export const updateSetting = async (
  path: string,
  value: any
): Promise<boolean> => {
  try {
    const settingRef = ref(database, `adminSettings/${path}`);
    await set(settingRef, value);
    
    console.log('✅ Setting updated:', path, value);
    return true;
  } catch (error) {
    console.error('❌ Error updating setting:', error);
    return false;
  }
};