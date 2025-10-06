import { useEffect, useState } from 'react';
import { ref, get, set, onValue, off, push, update, remove } from 'firebase/database';
import { database } from './config';
import { User } from '../types/firebase';
import { Task, WithdrawalRequest, AdminConfig } from '../types';

// Custom hook for Firebase user data
export const useFirebaseUser = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userRef = ref(database, `users/${userId}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          setUser(snapshot.val());
        } else {
          setUser(null);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(userRef, 'value', unsubscribe);
  }, [userId]);

  return { user, loading, error };
};

// Custom hook for all users (admin panel)
export const useFirebaseUsers = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          setUsers(snapshot.val());
        } else {
          setUsers({});
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(usersRef, 'value', unsubscribe);
  }, []);

  return { users, loading, error };
};

// Function to create or update user
export const createOrUpdateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    let finalUserData: User;
    
    if (snapshot.exists()) {
      // Update existing user
      const existingData = snapshot.val();
      finalUserData = { ...existingData, ...userData };
    } else {
      // Create new user with defaults
      finalUserData = {
        id: userId,
        userId,
        username: userData.username || 'Unknown',
        stars: userData.stars || 0,
        coins: userData.coins || 0,
        tier: userData.tier || 'free',
        dailyWithdrawals: userData.dailyWithdrawals || 0,
        referralCode: userData.referralCode || `REF${userId.slice(-6)}`,
        totalReferrals: userData.totalReferrals || 0,
        farmingRate: userData.farmingRate || 10,
        claimStreak: userData.claimStreak || 0,
        claimedDays: userData.claimedDays || [],
        badges: userData.badges || [],
        createdAt: userData.createdAt || Date.now(),
        isVIP: userData.isVIP || false,
        earningMultiplier: userData.earningMultiplier || 1,
        boosts: userData.boosts || 0,
        referralCount: userData.referralCount || 0,
        totalEarnings: userData.totalEarnings || 0,
        lastActive: Date.now(),
        vipExpiry: typeof userData.vipExpiry === 'number' ? userData.vipExpiry : null,
        vip_tier: userData.vip_tier || 'free',
        vip_expiry: userData.vip_expiry || null,
        multiplier: userData.multiplier || 1,
        withdraw_limit: userData.withdraw_limit || 1,
        referral_boost: userData.referral_boost || 1,
        ...userData
      };
    }
    
    await set(userRef, finalUserData);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
};

// Function to update specific user field
export const updateUserField = async (userId: string, field: keyof User, value: any): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}/${field}`);
    await set(userRef, value);
  } catch (error) {
    console.error('Error updating user field:', error);
    throw error;
  }
};

// Function to purchase VIP
export const purchaseVIP = async (userId: string, starCost: number = 100): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }
    
    const userData = snapshot.val() as User;
    
    if (userData.stars < starCost) {
      return false; // Insufficient stars
    }
    
    // Calculate VIP expiry (30 days from now)
    const vipExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
    
    const updatedData: Partial<User> = {
      stars: userData.stars - starCost,
      isVIP: true,
      earningMultiplier: 2,
      vipExpiry,
      lastActive: Date.now()
    };
    
    await set(userRef, { ...userData, ...updatedData });
    return true;
  } catch (error) {
    console.error('Error purchasing VIP:', error);
    throw error;
  }
};

// Custom hook for Firebase tasks
export const useFirebaseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tasksRef = ref(database, 'tasks');
    
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const tasksData = snapshot.val();
          const tasksList = Object.keys(tasksData).map(key => ({
            ...tasksData[key],
            id: key
          }));
          setTasks(tasksList);
        } else {
          setTasks([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(tasksRef, 'value', unsubscribe);
  }, []);

  return { tasks, loading, error };
};

// Function to add task
export const addTask = async (task: Omit<Task, 'id'>): Promise<string | null> => {
  try {
    const tasksRef = ref(database, 'tasks');
    const newTaskRef = push(tasksRef);
    await set(newTaskRef, { ...task, id: newTaskRef.key });
    return newTaskRef.key;
  } catch (error) {
    console.error('Error adding task:', error);
    return null;
  }
};

// Function to update task
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<boolean> => {
  try {
    const taskRef = ref(database, `tasks/${taskId}`);
    await update(taskRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating task:', error);
    return false;
  }
};

// Function to delete task
export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const taskRef = ref(database, `tasks/${taskId}`);
    await remove(taskRef);
    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    return false;
  }
};

// Custom hook for Firebase withdrawals
export const useFirebaseWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const withdrawalsRef = ref(database, 'withdrawals');
    
    const unsubscribe = onValue(withdrawalsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const withdrawalsData = snapshot.val();
          const withdrawalsList = Object.keys(withdrawalsData).map(key => ({
            ...withdrawalsData[key],
            id: key
          }));
          setWithdrawals(withdrawalsList);
        } else {
          setWithdrawals([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(withdrawalsRef, 'value', unsubscribe);
  }, []);

  return { withdrawals, loading, error };
};

// Function to add withdrawal request
export const addWithdrawal = async (withdrawal: Omit<WithdrawalRequest, 'id'>): Promise<string | null> => {
  try {
    const withdrawalsRef = ref(database, 'withdrawals');
    const newWithdrawalRef = push(withdrawalsRef);
    await set(newWithdrawalRef, { ...withdrawal, id: newWithdrawalRef.key });
    return newWithdrawalRef.key;
  } catch (error) {
    console.error('Error adding withdrawal:', error);
    return null;
  }
};

// Function to update withdrawal status
export const updateWithdrawal = async (withdrawalId: string, updates: Partial<WithdrawalRequest>): Promise<boolean> => {
  try {
    const withdrawalRef = ref(database, `withdrawals/${withdrawalId}`);
    await update(withdrawalRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return false;
  }
};

// Custom hook for admin configuration
export const useFirebaseConfig = () => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const configRef = ref(database, 'config');
    
    const unsubscribe = onValue(configRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          setConfig(snapshot.val());
        } else {
          setConfig(null);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(configRef, 'value', unsubscribe);
  }, []);

  return { config, loading, error };
};

// Function to update admin configuration
export const updateConfig = async (updates: Partial<AdminConfig>): Promise<boolean> => {
  try {
    const configRef = ref(database, 'config');
    await update(configRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating config:', error);
    return false;
  }
};

// User task completion tracking
export const useUserTaskCompletion = (userId: string | null) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const userTasksRef = ref(database, `userTasks/${userId}`);
    
    const unsubscribe = onValue(userTasksRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const tasksData = snapshot.val();
          setCompletedTasks(Object.keys(tasksData).filter(taskId => tasksData[taskId].completed));
        } else {
          setCompletedTasks([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(userTasksRef, 'value', unsubscribe);
  }, [userId]);

  return { completedTasks, loading, error };
};

// Function to complete task
export const completeUserTask = async (userId: string, taskId: string, reward: number): Promise<boolean> => {
  try {
    const userTaskRef = ref(database, `userTasks/${userId}/${taskId}`);
    await set(userTaskRef, {
      completed: true,
      completedAt: Date.now(),
      reward
    });
    return true;
  } catch (error) {
    console.error('Error completing task:', error);
    return false;
  }
};