export interface User {
  id: string;
  username: string;
  coins: number;
  stars: number;
  tier: UserTier;
  vipExpiry?: Date;
  dailyWithdrawals: number;
  lastWithdrawal?: Date;
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;
  farmingRate: number;
  lastClaim?: Date;
  claimStreak: number;
  badges: Badge[];
  createdAt: Date;
}

export type UserTier = 'free' | 'bronze' | 'diamond';

export interface TierConfig {
  name: string;
  starCost: number;
  dailyWithdrawals: number;
  minWithdrawal: number;
  farmingMultiplier: number;
  referralMultiplier: number;
  badge: BadgeType;
  color: string;
  features: string[];
}

export type BadgeType = 'bronze' | 'platinum' | 'diamond' | 'vip';

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
}

export interface DailyReward {
  day: number;
  coins: number;
  stars?: number;
  claimed: boolean;
  date: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'weekly' | 'special';
  completed: boolean;
  progress: number;
  maxProgress: number;
  icon: string;
}

export interface Referral {
  id: string;
  username: string;
  joinedAt: Date;
  totalEarnings: number;
  tier: UserTier;
  active: boolean;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  processedAt?: Date;
  method: string;
  details: Record<string, any>;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  starCost: number;
  type: 'tier_upgrade' | 'boost' | 'cosmetic';
  duration?: number; // in hours for temporary items
  multiplier?: number;
  icon: string;
  available: boolean;
  limited?: boolean;
  timeLeft?: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface FarmingSession {
  startTime: Date;
  endTime?: Date;
  baseRate: number;
  multiplier: number;
  totalEarned: number;
  active: boolean;
}

export type TabType = 'farm' | 'tasks' | 'referral' | 'profile' | 'withdraw';
export type OverlayTabType = 'shop' | 'vip' | 'boosts' | 'events';