// User interface is now defined in types/firebase.ts

export type UserTier = 'free' | 'bronze' | 'diamond';

export interface TierConfig {
  name: string;
  starCost: number;
  dailyWithdrawals: number;
  minWithdrawal: number;
  farmingMultiplier: number;
  referralMultiplier: number;
  badge: 'bronze' | 'platinum' | 'diamond' | 'vip';
  color: string;
  features: string[];
  duration: number; // VIP duration in days
}

// Badge interface and BadgeType moved to types/firebase.ts to avoid duplication

export interface DailyReward {
  day: number;
  coins: number;
  stars?: number;
  claimed: boolean;
  date: Date;
  vipBonus?: number; // Additional VIP bonus
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
  joinedAt: number; // Use timestamp
  totalEarnings: number;
  tier: UserTier;
  active: boolean;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number; // Use timestamp
  processedAt?: number; // Use timestamp
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
  timestamp: number; // Use timestamp
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface FarmingSession {
  startTime: number; // Use timestamp
  endTime?: number; // Use timestamp
  baseRate: number;
  multiplier: number;
  totalEarned: number;
  active: boolean;
}

export type TabType = 'farm' | 'tasks' | 'referral' | 'profile' | 'withdraw';
export type OverlayTabType = 'shop' | 'vip' | 'boosts' | 'events';

// Admin Panel Interfaces
export interface AdminConfig {
  tiers: Record<UserTier, TierConfig>;
  boosts: BoostConfig[];
  events: EventConfig[];
  settings: GlobalSettings;
}

export interface BoostConfig {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  duration: number; // hours
  starCost: number;
  active: boolean;
}

export interface EventConfig {
  id: string;
  name: string;
  description: string;
  type: 'limited_time' | 'special_offer' | 'bonus_multiplier';
  startDate: number; // Use timestamp
  endDate: number; // Use timestamp
  active: boolean;
  config: Record<string, any>;
}

export interface GlobalSettings {
  maintenanceMode: boolean;
  maxDailyWithdrawals: Record<UserTier, number>;
  minWithdrawalAmounts: Record<UserTier, number>;
  referralBonuses: Record<UserTier, number>;
  farmingRates: Record<UserTier, number>;
}

export interface AdminLog {
  id: string;
  type: 'purchase' | 'withdrawal' | 'claim' | 'referral' | 'admin_action' | 'vip_upgrade' | 'ban_user' | 'reset_streak';
  userId: string;
  username: string;
  action: string;
  details: Record<string, any>;
  timestamp: number; // Use timestamp
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promotion';
  active: boolean;
  createdAt: number; // Use timestamp
  expiresAt?: number; // Use timestamp
}

// Telegram Payment Interface
export interface TelegramPayment {
  invoiceId: string;
  userId: string;
  amount: number; // in stars
  description: string;
  payload: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  createdAt: number; // Use timestamp
  paidAt?: number; // Use timestamp
}