// Admin Controls System Types
export interface SystemSettings {
  // Farming Settings
  farmingRates: {
    free: number;
    bronze: number;
    diamond: number;
  };
  farmingMultipliers: {
    free: number;
    bronze: number;
    diamond: number;
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
  conversionRates: {
    coinsToINR: number; // How many coins = 1 INR
    starsToINR: number; // How many stars = 1 INR
  };
  
  // Withdrawal Settings
  withdrawalLimits: {
    free: { min: number; max: number; daily: number };
    bronze: { min: number; max: number; daily: number };
    diamond: { min: number; max: number; daily: number };
  };
  
  // VIP Settings
  vipPricing: {
    bronze: { stars: number; inr: number; duration: number };
    diamond: { stars: number; inr: number; duration: number };
  };
  
  // Referral Settings
  referralRewards: {
    free: number;
    bronze: number;
    diamond: number;
  };
  
  // Ads Settings
  adsSettings: {
    dailyLimit: number;
    rewardPerAd: number;
    adDuration: number;
    vipUnlimited: boolean;
  };
  
  // System Status
  maintenanceMode: boolean;
  registrationOpen: boolean;
  lastUpdated: number;
  updatedBy: string;
}

export interface AdminAction {
  id: string;
  type: 'settings_update' | 'vip_approval' | 'withdrawal_approval' | 'user_action';
  adminId: string;
  targetUserId?: string;
  action: string;
  details: Record<string, any>;
  timestamp: number;
}

export interface ConversionCalculation {
  coins: number;
  inr: number;
  rate: number;
}