import { create } from 'zustand';
import { UserTier, TierConfig, DailyReward, Task, Referral, WithdrawalRequest, ShopItem, Notification, FarmingSession, TabType, OverlayTabType } from '../types';
import { User } from '../types/firebase';

// Tier configurations - Updated for premium hybrid dashboard
export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  free: {
    name: 'Free',
    starCost: 0,
    dailyWithdrawals: 1,
    minWithdrawal: 200,
    farmingMultiplier: 1,
    referralMultiplier: 1,
    badge: 'bronze',
    color: '#94a3b8',
    features: ['1 withdrawal/day', 'min ₹200', 'Bronze badge'],
    duration: 0
  },
  bronze: {
    name: 'Bronze VIP',
    starCost: 75,
    dailyWithdrawals: 3,
    minWithdrawal: 100,
    farmingMultiplier: 2,
    referralMultiplier: 1,
    badge: 'platinum',
    color: '#f59e0b',
    features: ['3 withdrawals/day', 'min ₹100', '2× farming speed', 'Platinum badge'],
    duration: 30
  },
  diamond: {
    name: 'Diamond VIP',
    starCost: 150,
    dailyWithdrawals: 5,
    minWithdrawal: 200,
    farmingMultiplier: 2.5,
    referralMultiplier: 1.5,
    badge: 'diamond',
    color: '#3b82f6',
    features: ['5 withdrawals/day', 'min ₹200', '2.5× farming speed', '1.5× referral reward', 'Diamond badge'],
    duration: 30
  }
};

interface AppState {
  // User data
  user: User | null;
  
  // UI state
  activeTab: TabType;
  activeOverlayTab: OverlayTabType | null;
  isLoading: boolean;
  
  // Farming
  farmingSession: FarmingSession | null;
  
  // Daily rewards
  dailyRewards: DailyReward[];
  
  // Tasks
  tasks: Task[];
  
  // Referrals
  referrals: Referral[];
  
  // Withdrawals
  withdrawalRequests: WithdrawalRequest[];
  
  // Shop
  shopItems: ShopItem[];
  
  // Notifications
  notifications: Notification[];
  
  // Actions
  setUser: (user: User) => void;
  setActiveTab: (tab: TabType) => void;
  setActiveOverlayTab: (tab: OverlayTabType | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Farming actions
  startFarming: () => void;
  stopFarming: () => void;
  updateFarmingEarnings: () => void;
  
  // Daily rewards
  claimDailyReward: (day: number) => void;
  
  // Tasks
  completeTask: (taskId: string) => void;
  
  // Shop actions
  purchaseItem: (itemId: string) => Promise<boolean>;
  upgradeTier: (tier: UserTier) => Promise<boolean>;
  
  // Withdrawal
  requestWithdrawal: (amount: number, method: string, details: Record<string, any>) => Promise<boolean>;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: {
    id: '1',
    userId: '1',
    username: 'BotUser',
    coins: 1250,
    stars: 45,
    tier: 'free',
    dailyWithdrawals: 0,
    referralCode: 'BOT123',
    totalReferrals: 3,
    farmingRate: 10,
    claimStreak: 2,
    claimedDays: [1, 2], // Days 1 and 2 already claimed
    badges: [
      {
        type: 'bronze',
        name: 'Bronze Member',
        description: 'Welcome to the community!',
        icon: '🥉',
        color: '#cd7f32',
        unlockedAt: Date.now()
      }
    ],
    createdAt: Date.now(),
    lastActive: Date.now(),
    totalEarnings: 0,
    isVIP: false,
    earningMultiplier: 1,
    boosts: 0,
    referralCount: 0,
    // VIP expiry field
    vipExpiry: null,
    // New VIP fields
    vip_tier: 'free',
    vip_expiry: null,
    multiplier: 1,
    withdraw_limit: 1,
    referral_boost: 1
  },
  
  activeTab: 'farm',
  activeOverlayTab: null,
  isLoading: false,
  
  farmingSession: null,
  
  dailyRewards: Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    coins: 50 + (i * 10),
    stars: i === 6 ? 5 : undefined,
    claimed: i < 2,
    date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)),
    vipBonus: Math.floor((50 + (i * 10)) * 0.5) // 50% VIP bonus
  })),
  
  tasks: [
    {
      id: '1',
      title: 'Daily Login',
      description: 'Login to the bot daily',
      reward: 25,
      type: 'daily',
      completed: true,
      progress: 1,
      maxProgress: 1,
      icon: '📅'
    },
    {
      id: '2',
      title: 'Invite Friends',
      description: 'Invite 5 friends to join',
      reward: 100,
      type: 'weekly',
      completed: false,
      progress: 3,
      maxProgress: 5,
      icon: '👥'
    },
    {
      id: '3',
      title: 'Farm 1000 Coins',
      description: 'Accumulate 1000 coins from farming',
      reward: 50,
      type: 'daily',
      completed: false,
      progress: 750,
      maxProgress: 1000,
      icon: '🌾'
    }
  ],
  
  referrals: [
    {
      id: '1',
      username: 'Friend1',
      joinedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      totalEarnings: 150,
      tier: 'free',
      active: true
    },
    {
      id: '2',
      username: 'Friend2',
      joinedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      totalEarnings: 75,
      tier: 'bronze',
      active: true
    }
  ],
  
  withdrawalRequests: [],
  
  shopItems: [
    {
      id: 'bronze_upgrade',
      name: 'Bronze VIP',
      description: '2× farming speed, 3 withdrawals/day, Platinum badge',
      starCost: 75,
      type: 'tier_upgrade',
      icon: '🥉',
      available: true
    },
    {
      id: 'diamond_upgrade',
      name: 'Diamond VIP',
      description: '2.5× farming speed, 5 withdrawals/day, Diamond badge, 1.5× referral rewards',
      starCost: 150,
      type: 'tier_upgrade',
      icon: '💎',
      available: true
    },
    {
      id: 'speed_boost',
      name: '2× Speed Boost',
      description: 'Double your farming speed for 24 hours',
      starCost: 25,
      type: 'boost',
      duration: 24,
      multiplier: 2,
      icon: '⚡',
      available: true
    }
  ],
  
  notifications: [],
  
  // Actions
  setUser: (user) => set({ user }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveOverlayTab: (tab) => set({ activeOverlayTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Farming actions
  startFarming: () => {
    const { user } = get();
    if (!user) return;
    
    const tierConfig = TIER_CONFIGS[user.tier];
    const session: FarmingSession = {
      startTime: Date.now(),
      baseRate: user.farmingRate,
      multiplier: tierConfig.farmingMultiplier,
      totalEarned: 0,
      active: true
    };
    
    set({ farmingSession: session });
  },
  
  stopFarming: () => {
    const { farmingSession, user } = get();
    if (!farmingSession || !user) return;
    
    const endTime = Date.now();
    const duration = (endTime - farmingSession.startTime) / 1000 / 60; // minutes
    const earned = Math.floor(duration * farmingSession.baseRate * farmingSession.multiplier);
    
    set({
      farmingSession: { ...farmingSession, endTime, totalEarned: earned, active: false },
      user: { ...user, coins: user.coins + earned }
    });
  },
  
  updateFarmingEarnings: () => {
    const { farmingSession, user } = get();
    if (!farmingSession?.active || !user) return;
    
    const now = Date.now();
    const duration = (now - farmingSession.startTime) / 1000 / 60; // minutes
    const earned = Math.floor(duration * farmingSession.baseRate * farmingSession.multiplier);
    
    set({
      user: { ...user, coins: user.coins + (earned - farmingSession.totalEarned) },
      farmingSession: { ...farmingSession, totalEarned: earned }
    });
  },
  
  // Daily rewards
  claimDailyReward: (day) => {
    const { dailyRewards, user } = get();
    if (!user) return;
    
    const reward = dailyRewards.find(r => r.day === day);
    if (!reward || user.claimedDays.includes(day)) return;
    
    const isVip = user.vip_tier !== 'free' && user.vip_expiry && user.vip_expiry > Date.now();
    const vipBonus = isVip ? reward.vipBonus || 0 : 0;
    const totalCoins = reward.coins + vipBonus;
    
    set({
      user: {
        ...user,
        coins: user.coins + totalCoins,
        stars: user.stars + (reward.stars || 0),
        claimStreak: user.claimStreak + 1,
        claimedDays: [...user.claimedDays, day]
      }
    });
    
    get().addNotification({
      type: 'success',
      title: 'Daily Reward Claimed!',
      message: `+${totalCoins} coins${reward.stars ? ` +${reward.stars} stars` : ''}${vipBonus > 0 ? ` (VIP bonus: +${vipBonus})` : ''}`
    });
  },
  
  // Tasks
  completeTask: (taskId) => {
    const { tasks, user } = get();
    if (!user) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    set({
      tasks: tasks.map(t => 
        t.id === taskId ? { ...t, completed: true, progress: t.maxProgress } : t
      ),
      user: { ...user, coins: user.coins + task.reward }
    });
    
    get().addNotification({
      type: 'success',
      title: 'Task Completed!',
      message: `${task.title} - +${task.reward} coins`
    });
  },
  
  // Shop actions
  purchaseItem: async (itemId) => {
    const { shopItems, user } = get();
    if (!user) return false;
    
    const item = shopItems.find(i => i.id === itemId);
    if (!item || !item.available || user.stars < item.starCost) return false;
    
    set({ isLoading: true });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    set({
      user: { ...user, stars: user.stars - item.starCost },
      isLoading: false
    });
    
    get().addNotification({
      type: 'success',
      title: 'Purchase Successful!',
      message: `${item.name} purchased for ${item.starCost} stars`
    });
    
    return true;
  },
  
  upgradeTier: async (tier) => {
    const { user } = get();
    if (!user) return false;
    
    const tierConfig = TIER_CONFIGS[tier];
    if (user.stars < tierConfig.starCost) return false;
    
    set({ isLoading: true });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const vipExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days VIP
    
    set({
      user: {
        ...user,
        tier,
        stars: user.stars - tierConfig.starCost,
        vipExpiry,
        badges: [
          ...user.badges,
          {
            type: tierConfig.badge,
            name: `${tierConfig.name} Member`,
            description: `Upgraded to ${tierConfig.name}`,
            icon: tier === 'bronze' ? '🥉' : '💎',
            color: tierConfig.color,
            unlockedAt: Date.now()
          }
        ]
      },
      isLoading: false
    });
    
    get().addNotification({
      type: 'success',
      title: 'VIP Activated!',
      message: `Welcome to ${tierConfig.name}! Enjoy your premium benefits.`
    });
    
    return true;
  },
  
  // Withdrawal
  requestWithdrawal: async (amount, method, details) => {
    const { user, withdrawalRequests } = get();
    if (!user) return false;
    
    const tierConfig = TIER_CONFIGS[user.tier];
    if (amount < tierConfig.minWithdrawal || user.coins < amount) return false;
    
    const today = new Date().toDateString();
    const todayWithdrawals = withdrawalRequests.filter(
      w => new Date(w.requestedAt).toDateString() === today
    ).length;
    
    if (todayWithdrawals >= tierConfig.dailyWithdrawals) return false;
    
    const newRequest: WithdrawalRequest = {
      id: Date.now().toString(),
      amount,
      status: 'pending',
      requestedAt: Date.now(),
      method,
      details
    };
    
    set({
      user: { ...user, coins: user.coins - amount },
      withdrawalRequests: [...withdrawalRequests, newRequest]
    });
    
    get().addNotification({
      type: 'info',
      title: 'Withdrawal Requested',
      message: `₹${amount} withdrawal request submitted`
    });
    
    return true;
  },
  
  // Notifications
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    };
    
    set(state => ({
      notifications: [newNotification, ...state.notifications]
    }));
  },
  
  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  }
}));