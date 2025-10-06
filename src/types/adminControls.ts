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

export interface AdminAction {
  id: string;
  adminId: string;
  action: 'approve_vip' | 'reject_vip' | 'approve_withdrawal' | 'reject_withdrawal' | 'update_settings' | 'ban_user' | 'unban_user';
  targetId: string; // user ID or request ID
  details: Record<string, any>;
  timestamp: number;
  notes?: string;
}