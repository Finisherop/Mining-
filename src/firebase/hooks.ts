import { useEffect, useState } from 'react';
import { ref, get, set, onValue, off, push, update, remove } from 'firebase/database';
import { database } from './config';
import { User } from '../types/firebase';
import { Task, WithdrawalRequest, AdminConfig } from '../types';
import { 
  extractSafeUserId, 
  createSafeFirebasePath, 
  sanitizeFirebasePath 
} from '../utils/firebaseSanitizer';
import { 
  createSafeRef, 
  safeGet, 
  safeSet, 
  safeUpdate, 
  setupSafeListener,
  safeCreateOrUpdateUser 
} from './safeConnection';

// SAFE: Custom hook for Firebase user data with path sanitization
export const useFirebaseUser = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // SAFE: Use sanitized user ID and safe path creation
      const safeUserId = extractSafeUserId(userId);
      const userPath = createSafeFirebasePath('users', safeUserId);
      
      console.log(`🔒 Setting up safe user listener for ID: ${safeUserId}`);
      
      // SAFE: Use safe listener setup with automatic cleanup
      const cleanup = setupSafeListener(
        userPath,
        (data) => {
          try {
            setUser(data);
            setError(null);
            console.log(`✅ User data loaded safely for ID: ${safeUserId}`);
          } catch (err) {
            console.error('❌ Error processing user data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error(`❌ Firebase user listener error for ID ${safeUserId}:`, err);
          setError(err.message);
          setLoading(false);
        }
      );

      return cleanup;
    } catch (err) {
      console.error('❌ Failed to setup user listener:', err);
      setError(err instanceof Error ? err.message : 'Failed to setup user listener');
      setLoading(false);
    }
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

// SAFE: Function to create or update user with sanitized data
export const createOrUpdateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
  try {
    console.log(`🔒 Creating/updating user with safe methods for ID: ${userId}`);
    
    // SAFE: Use the safe create/update method with automatic sanitization
    const success = await safeCreateOrUpdateUser(userId, userData);
    
    if (success) {
      console.log(`✅ User created/updated successfully with safe methods for ID: ${userId}`);
    } else {
      console.error(`❌ Failed to create/update user for ID: ${userId}`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Error in createOrUpdateUser:', error);
    
    // Additional error context for debugging
    if (error instanceof Error && error.message.includes('Invalid token in path')) {
      console.error('🚨 DETECTED: Invalid Firebase path characters in user data');
      console.error('🔍 User ID:', userId);
      console.error('🔍 User Data:', userData);
    }
    
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

// Custom hook for Firebase tasks
export const useFirebaseTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tasksRef = ref(database, 'tasks');
    
    const unsubscribe = onValue(tasksRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
      try {
        if (snapshot.exists()) {
          const tasksData = snapshot.val();
          const tasksList = Object.keys(tasksData).map(key => ({
            ...tasksData[key],
            id: key
          }));
          // FIX: Only update if data actually changed to prevent blinking
          setTasks(prevTasks => {
            const currentIds = prevTasks.map(t => t.id).sort().join(',');
            const newIds = tasksList.map(t => t.id).sort().join(',');
            
            // Only update if task list actually changed
            if (currentIds !== newIds || JSON.stringify(prevTasks) !== JSON.stringify(tasksList)) {
              console.log('📝 Tasks updated from Firebase:', tasksList.length);
              return tasksList;
            }
            return prevTasks;
          });
        } else {
          setTasks([]);
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