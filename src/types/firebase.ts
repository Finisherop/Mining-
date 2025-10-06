export interface User {
  id: string;
  userId: string;
  username: string;
  coins: number;
  stars: number;
  tier: 'free' | 'bronze' | 'diamond';
  vipExpiry?: Date;
  dailyWithdrawals: number;
  lastWithdrawal?: Date;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  farmingRate: number;
  lastClaim?: Date;
  claimStreak: number;
  claimedDays: number[];
  badges: Badge[];
  createdAt: Date | number;
  lastActive: number;
  totalEarnings: number;
  isVIP: boolean;
  earningMultiplier: number;
  boosts: number;
  referralCount: number;
  // New VIP fields
  vip_tier: 'free' | 'bronze' | 'diamond';
  vip_expiry: number | null;
  multiplier: number;
  withdraw_limit: number;
  referral_boost: number;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebAppData {
  user?: TelegramUser;
  start_param?: string;
}

export interface Badge {
  type: 'bronze' | 'platinum' | 'diamond' | 'vip';
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
}