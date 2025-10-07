import { useEffect, useState } from 'react';
import { ref, get, set, onValue, off, push, update, remove } from 'firebase/database';
import { database } from './config';
import { User } from '../types/firebase';
import { Task, WithdrawalRequest, AdminConfig } from '../types';
import { extractSafeUserId, sanitizeFirebasePath } from '../utils/firebaseSanitizer';
import { safeCreateOrUpdateUser, createSafeRef } from './safeConnection';

// Simplified Firebase user hook with background sync
export const useFirebaseUser = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Changed: No initial loading state

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // SAFE: Use sanitized user ID for Firebase path (keeping security from main)
      const safeUserId = extractSafeUserId(userId);
      const userRef = ref(database, `users/${safeUserId}`);
      console.log(`🔒 Setting up safe Firebase sync for user: ${safeUserId}`);
    
    // Set up real-time listener for background sync
    const unsubscribe = onValue(userRef, (snapshot: any) => {
      try {
        if (snapshot.exists()) {
          const userData = snapshot.val() as User;
          console.log('📱 Firebase user data updated:', userData.firstName);
          setUser(userData);
        } else {
          console.log('👤 No Firebase user data found - will create new user');
          setUser(null);
        }
      } catch (err) {
        console.error('Firebase sync error (non-blocking):', err);
        // Don't set error state - let app continue with cached data
      } finally {
        setLoading(false);
      }
    }, (err: any) => {
      console.error('Firebase listener error (non-blocking):', err);
      setLoading(false);
      // Don't block app - continue with cached data
    });

    return () => off(userRef, 'value', unsubscribe);
    } catch (err) {
      console.error('❌ Failed to setup user listener:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup user listener');
      setLoading(false);
    }
  }, [userId]);

  return { user, loading };
};


// Custom hook for all users (admin panel)
export const useFirebaseUsers = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const usersRef = ref(database, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
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
    }, (err: any) => { // <-- ERROR FIX: Add explicit type for Firebase error callback
      setError(err.message);
      setLoading(false);
    });

    return () => off(usersRef, 'value', unsubscribe);
  }, []);

  return { users, loading, error };
};

// SAFE: Function to create or update user with path sanitization
export const createOrUpdateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
  try {
    console.log(`🔒 Creating/updating user with safe methods: ${userId}`);
    
    // Validate userId
    if (!userId || userId === 'null' || userId === 'undefined') {
      console.error('❌ Invalid userId provided:', userId);
      return false;
    }

    // SAFE: Use sanitized methods for user creation/update
    const success = await safeCreateOrUpdateUser(userId, userData);
    
    if (success) {
      console.log(`✅ User created/updated successfully with safe methods: ${userId}`);
    } else {
      console.error(`❌ Failed to create/update user: ${userId}`);
    }
    
    return success;
    
    // Test database connection first
    if ((window as any).firebaseConnected !== true) {
      console.warn('⚠️ Firebase not connected, attempting offline operation');
      // Try to use cached data or return false
      return false;
    }
    
    let snapshot;
    try {
      snapshot = await get(userRef);
    } catch (dbError) {
      console.error('❌ Database read error:', dbError);
      // If read fails, try to create new user anyway
      snapshot = null;
    }
    
    let finalUserData: User;
    
    if (snapshot && snapshot.exists()) {
      // Update existing user
      const existingData = snapshot.val();
      console.log('📝 Updating existing user data');
      finalUserData = { 
        ...existingData, 
        ...userData,
        lastActive: Date.now() // Always update last active
      };
    } else {
      // Create new user with comprehensive defaults
      console.log('🆕 Creating new user with defaults');
      finalUserData = {
        id: userId,
        userId,
        username: userData.username || userData.firstName || `user_${userId.slice(-6)}`,
        firstName: userData.firstName || 'User',
        lastName: userData.lastName || '',
        stars: userData.stars || 10, // Starting stars
        coins: userData.coins || 1000, // Starting coins
        tier: userData.tier || 'free',
        vipType: userData.vipType || 'free',
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
        banned: userData.banned || false,
        vipExpiry: typeof userData.vipExpiry === 'number' ? userData.vipExpiry : null,
        vip_tier: userData.vip_tier || 'free',
        vip_expiry: userData.vip_expiry || null,
        multiplier: userData.multiplier || 1,
        withdraw_limit: userData.withdraw_limit || 1000,
        referral_boost: userData.referral_boost || 1,
        photo_url: userData.photo_url || undefined,
        // Add any additional fields from userData
        ...userData
      };
    }
    
    // Attempt to save to database with retry logic
    let saveAttempts = 0;
    const maxSaveAttempts = 3;
    
    while (saveAttempts < maxSaveAttempts) {
      try {
        await set(userRef, finalUserData);
        console.log(`✅ User ${userId} saved successfully to database`);
        return true;
      } catch (saveError) {
        saveAttempts++;
        console.error(`❌ Database save error (attempt ${saveAttempts}/${maxSaveAttempts}):`, saveError);
        
        if (saveAttempts < maxSaveAttempts) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * saveAttempts));
        }
      }
    }
    
    console.error('❌ Failed to save user after all attempts');
    return false;
    
  } catch (error) {
    console.error('❌ Error in createOrUpdateUser:', error);
    return false;
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

// Simplified Firebase tasks hook - loads immediately
export const useFirebaseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false); // Changed: No initial loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tasksRef = ref(database, 'tasks');
    
    const unsubscribe = onValue(tasksRef, (snapshot: any) => {
      try {
        if (snapshot.exists()) {
          const tasksData = snapshot.val();
          const tasksList = Object.keys(tasksData).map(key => ({
            ...tasksData[key],
            id: key
          }));
          
          // Update tasks immediately
          setTasks(tasksList);
          console.log('📝 Tasks loaded from Firebase:', tasksList.length);
        } else {
          setTasks([]);
        }
        setError(null);
      } catch (err) {
        console.error('Tasks loading error (non-blocking):', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err: any) => {
      console.error('Tasks listener error (non-blocking):', err);
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
    console.log('✅ Task updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating task:', error);
    return false;
  }
};

// Function to delete task
export const deleteTask = async (taskId: string): Promise<boolean> => {
  try {
    const taskRef = ref(database, `tasks/${taskId}`);
    await set(taskRef, null); // Delete by setting to null
    console.log('✅ Task deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting task:', error);
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
    
    const unsubscribe = onValue(withdrawalsRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
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
    }, (err: any) => { // <-- ERROR FIX: Add explicit type for Firebase error callback
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
    
    const unsubscribe = onValue(configRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
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
    }, (err: any) => { // <-- ERROR FIX: Add explicit type for Firebase error callback
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
    
    const unsubscribe = onValue(userTasksRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
      try {
        if (snapshot.exists()) {
          const tasksData = snapshot.val();
          const completedTaskIds = Object.keys(tasksData).filter(taskId => tasksData[taskId].completed);
          
          // FIX: Only update if completed tasks actually changed to prevent blinking
          setCompletedTasks(prevCompleted => {
            const currentIds = prevCompleted.sort().join(',');
            const newIds = completedTaskIds.sort().join(',');
            
            if (currentIds !== newIds) {
              console.log('✅ Completed tasks updated:', completedTaskIds.length);
              return completedTaskIds;
            }
            return prevCompleted;
          });
        } else {
          setCompletedTasks([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err: any) => { // <-- ERROR FIX: Add explicit type for Firebase error callback
      setError(err.message);
      setLoading(false);
    });

    return () => off(userTasksRef, 'value', unsubscribe);
  }, [userId]);

  return { completedTasks, loading, error };
};

// User task verification tracking
export const useUserTaskVerification = (userId: string | null) => {
  const [verifiedTasks, setVerifiedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const verifiedTasksRef = ref(database, `userTasks/${userId}`);
    
    const unsubscribe = onValue(verifiedTasksRef, (snapshot: any) => {
      try {
        if (snapshot.exists()) {
          const tasksData = snapshot.val();
          const verifiedTaskIds = Object.keys(tasksData).filter(taskId => tasksData[taskId].verified);
          
          setVerifiedTasks(prevVerified => {
            const currentIds = prevVerified.sort().join(',');
            const newIds = verifiedTaskIds.sort().join(',');
            
            if (currentIds !== newIds) {
              console.log('✅ Verified tasks updated:', verifiedTaskIds.length);
              return verifiedTaskIds;
            }
            return prevVerified;
          });
        } else {
          setVerifiedTasks([]);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err: any) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(verifiedTasksRef, 'value', unsubscribe);
  }, [userId]);

  return { verifiedTasks, loading, error };
};

// Mark task as verified (link opened)
export const markTaskAsVerified = async (userId: string, taskId: string): Promise<boolean> => {
  try {
    const taskRef = ref(database, `userTasks/${userId}/${taskId}`);
    await update(taskRef, {
      verified: true,
      verifiedAt: Date.now()
    });
    
    console.log('✅ Task marked as verified:', taskId);
    return true;
  } catch (error) {
    console.error('❌ Error marking task as verified:', error);
    return false;
  }
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