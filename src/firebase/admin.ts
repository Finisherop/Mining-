import { ref, get, set, push, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { database } from './config';
import { AdminConfig, AdminLog, BroadcastMessage, TelegramPayment } from '../types';
import { User } from '../types/firebase';

// Admin Configuration Management
export const getAdminConfig = async (): Promise<AdminConfig | null> => {
  try {
    const configRef = ref(database, 'config');
    const snapshot = await get(configRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting admin config:', error);
    return null;
  }
};

export const updateAdminConfig = async (config: Partial<AdminConfig>): Promise<void> => {
  try {
    const configRef = ref(database, 'config');
    await set(configRef, config);
  } catch (error) {
    console.error('Error updating admin config:', error);
    throw error;
  }
};

// User Management
export const getAllUsers = (): Promise<Record<string, User>> => {
  return new Promise((resolve, reject) => {
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      try {
        const users = snapshot.exists() ? snapshot.val() : {};
        resolve(users);
        off(usersRef, 'value', unsubscribe);
      } catch (error) {
        reject(error);
      }
    }, (error) => {
      reject(error);
    });
  });
};

export const updateUserVIP = async (
  userId: string, 
  tier: 'bronze' | 'diamond', 
  duration: number = 30
): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.val() as User;
    const vipExpiry = Date.now() + (duration * 24 * 60 * 60 * 1000);
    
    const updatedData: Partial<User> = {
      vip_tier: tier,
      vip_expiry: vipExpiry,
      multiplier: tier === 'bronze' ? 2 : 2.5,
      withdraw_limit: tier === 'bronze' ? 3 : 5,
      referral_boost: tier === 'bronze' ? 1 : 1.5,
      tier, // Update legacy field
    };

    await set(userRef, { ...userData, ...updatedData });
    
    // Log admin action
    await logAdminAction('vip_upgrade', userId, userData.username, {
      tier,
      duration,
      vipExpiry
    });
  } catch (error) {
    console.error('Error updating user VIP:', error);
    throw error;
  }
};

export const banUser = async (userId: string, reason: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}/banned`);
    await set(userRef, {
      banned: true,
      reason,
      bannedAt: Date.now()
    });
    
    // Log admin action
    await logAdminAction('ban_user', userId, 'Unknown', { reason });
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

export const resetUserStreak = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }

    const userData = snapshot.val() as User;
    
    await set(userRef, {
      ...userData,
      claimStreak: 0,
      claimedDays: []
    });
    
    // Log admin action
    await logAdminAction('reset_streak', userId, userData.username, {});
  } catch (error) {
    console.error('Error resetting user streak:', error);
    throw error;
  }
};

// Logging System
export const logAdminAction = async (
  type: AdminLog['type'],
  userId: string,
  username: string,
  details: Record<string, any>
): Promise<void> => {
  try {
    const logsRef = ref(database, 'logs');
    const logEntry: Omit<AdminLog, 'id'> = {
      type,
      userId,
      username,
      action: `Admin ${type.replace('_', ' ')}`,
      details,
      timestamp: Date.now()
    };
    
    await push(logsRef, logEntry);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

export const getAdminLogs = async (limit: number = 100): Promise<AdminLog[]> => {
  try {
    const logsRef = ref(database, 'logs');
    const snapshot = await get(logsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const logs = snapshot.val();
    return Object.entries(logs)
      .map(([logId, log]) => ({ id: logId, ...(log as Omit<AdminLog, 'id'>) }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting admin logs:', error);
    return [];
  }
};

// Broadcast Messages
export const createBroadcast = async (
  title: string,
  message: string,
  type: BroadcastMessage['type'] = 'info',
  expiresAt?: Date
): Promise<void> => {
  try {
    const broadcastsRef = ref(database, 'broadcasts');
    const broadcast: Omit<BroadcastMessage, 'id'> = {
      title,
      message,
      type,
      active: true,
      createdAt: Date.now(),
      expiresAt: expiresAt ? expiresAt.getTime() : undefined
    };
    
    await push(broadcastsRef, broadcast);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    throw error;
  }
};

export const getBroadcasts = async (): Promise<BroadcastMessage[]> => {
  try {
    const broadcastsRef = ref(database, 'broadcasts');
    const snapshot = await get(broadcastsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const broadcasts = snapshot.val();
    return Object.entries(broadcasts)
      .map(([id, broadcast]) => ({ id, ...(broadcast as Omit<BroadcastMessage, 'id'>) }))
      .filter(broadcast => {
        if (!broadcast.active) return false;
        if (broadcast.expiresAt && broadcast.expiresAt < Date.now()) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting broadcasts:', error);
    return [];
  }
};

export const deactivateBroadcast = async (broadcastId: string): Promise<void> => {
  try {
    const broadcastRef = ref(database, `broadcasts/${broadcastId}/active`);
    await set(broadcastRef, false);
  } catch (error) {
    console.error('Error deactivating broadcast:', error);
    throw error;
  }
};

// Payment Management
export const logPayment = async (payment: Omit<TelegramPayment, 'createdAt'>): Promise<void> => {
  try {
    const paymentsRef = ref(database, 'payments');
    const paymentData: TelegramPayment = {
      ...payment,
      createdAt: Date.now()
    };
    
    await push(paymentsRef, paymentData);
  } catch (error) {
    console.error('Error logging payment:', error);
    throw error;
  }
};

export const getPaymentHistory = async (userId?: string): Promise<TelegramPayment[]> => {
  try {
    const paymentsRef = ref(database, 'payments');
    let queryRef;
    
    if (userId) {
      queryRef = query(paymentsRef, orderByChild('userId'), equalTo(userId));
    } else {
      queryRef = paymentsRef;
    }
    
    const snapshot = await get(queryRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const payments = snapshot.val();
    return Object.entries(payments)
      .map(([, payment]) => ({ ...(payment as TelegramPayment) }))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting payment history:', error);
    return [];
  }
};

// Statistics
export const getAdminStats = async () => {
  try {
    const [users, payments, logs] = await Promise.all([
      getAllUsers(),
      getPaymentHistory(),
      getAdminLogs(50)
    ]);

    const userArray = Object.values(users);
    const totalUsers = userArray.length;
    const vipUsers = userArray.filter(user => 
      user.vip_tier !== 'free' && 
      user.vip_expiry && 
      user.vip_expiry > Date.now()
    ).length;
    
    const totalPayments = payments.filter(p => p.status === 'paid').length;
    const totalRevenue = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const activeUsers = userArray.filter(user => 
      user.lastActive > Date.now() - (7 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      totalUsers,
      vipUsers,
      activeUsers,
      totalPayments,
      totalRevenue,
      recentLogs: logs.slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      vipUsers: 0,
      activeUsers: 0,
      totalPayments: 0,
      totalRevenue: 0,
      recentLogs: []
    };
  }
};