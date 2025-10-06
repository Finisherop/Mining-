// Admin Controls System Types
export interface AdminSettings {
  // Farming Settings
  farming: {
    baseRate: number; // coins per minute
    maxDuration: number; // maximum farming duration in hours
    cooldownTime: number; // cooldown between farming sessions in minutes
  };
  
  // Task Rewards
  taskRewards: {
    daily: number;
    weekly: number;
    youtube: number;
    telegram: number;
    website: number;
    ads: number;
  };
  
  // Conversion Rates
  conversion: {
    coinsToInr: number; // how many coins = 1 INR
    starsToInr: number; // how many stars = 1 INR
    adsReward: number; // coins per ad
  };
  
  // Withdrawal Settings
  withdrawal: {
    minAmounts: {
      free: number;
      bronze: number;
      diamond: number;
    };
    dailyLimits: {
      free: number;
      bronze: number;
      diamond: number;
    };
    processingFee: number; // percentage
  };
  
  // VIP Settings
  vip: {
    prices: {
      bronze: number; // in stars
      diamond: number; // in stars
    };
    duration: number; // days
    multipliers: {
      bronze: number;
      diamond: number;
    };
  };
  
  // System Settings
  system: {
    maintenanceMode: boolean;
    maxUsersPerDay: number;
    referralBonus: number;
    dailyClaimCooldown: number; // hours
  };
}

// ERROR FIX: Add missing SystemSettings interface and fix AdminAction union type
export interface SystemSettings {
  farmingRates: { free: number; bronze: number; diamond: number };
  farmingMultipliers: { free: number; bronze: number; diamond: number };
  taskRewards: {
    daily: number;
    weekly: number;
    youtube: number;
    telegram: number;
    website: number;
    ads: number;
  };
  conversionRates: {
    coinsToINR: number;
    starsToINR: number;
  };
  withdrawalLimits: {
    free: { min: number; max: number; daily: number };
    bronze: { min: number; max: number; daily: number };
    diamond: { min: number; max: number; daily: number };
  };
  vipPricing: {
    bronze: { stars: number; inr: number; duration: number };
    diamond: { stars: number; inr: number; duration: number };
  };
  referralRewards: { free: number; bronze: number; diamond: number };
  adsSettings: {
    dailyLimit: number;
    rewardPerAd: number;
    adDuration: number;
    vipUnlimited: boolean;
  };
  maintenanceMode: boolean;
  registrationOpen: boolean;
  lastUpdated: number;
  updatedBy: string;
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: 'approve_vip' | 'reject_vip' | 'approve_withdrawal' | 'reject_withdrawal' | 'update_settings' | 'ban_user' | 'unban_user' | 'settings_update'; // <-- fix union type to include 'settings_update'
  targetId: string; // user ID or request ID
  details: Record<string, any>;
  timestamp: number;
  notes?: string;
}