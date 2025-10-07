export interface User {
  id: string;
  userId: string;
  username: string;
  firstName?: string; // User's first name
  lastName?: string; // User's last name
  coins: number;
  stars: number;
  tier: 'free' | 'bronze' | 'diamond';
  vipType?: 'free' | 'bronze' | 'diamond'; // VIP type for admin control
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
  banned?: boolean; // User ban status for admin control
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