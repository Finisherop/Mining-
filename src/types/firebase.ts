export interface User {
  id: string;
  userId: string;
  username: string;
  coins: number;
  stars: number;
  tier: 'free' | 'bronze' | 'diamond';
  vipExpiry: number | null; // Use timestamp for consistency
  dailyWithdrawals: number;
  lastWithdrawal?: number; // Use timestamp
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  farmingRate: number;
  lastClaim?: number; // Use timestamp
  claimStreak: number;
  claimedDays: number[];
  badges: Badge[];
  createdAt: number; // Use timestamp for consistency
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
  photo_url?: string; // User profile photo from Telegram
}


export type BadgeType = 'bronze' | 'platinum' | 'diamond' | 'vip';

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: number; // Use timestamp for consistency
}