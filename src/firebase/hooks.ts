import { useEffect, useState } from 'react';
import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from './config';
import { User } from '../types/firebase';

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
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setError('Connection timeout');
      setLoading(false);
    }, 8000);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      try {
        clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      setError(err.message);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      off(userRef, 'value', unsubscribe);
    };
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
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setError('Connection timeout');
      setLoading(false);
    }, 8000);
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      try {
        clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      setError(err.message);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      off(usersRef, 'value', unsubscribe);
    };
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
        userId,
        username: userData.username || 'Unknown',
        stars: userData.stars || 0,
        isVIP: userData.isVIP || false,
        earningMultiplier: userData.earningMultiplier || 1,
        boosts: userData.boosts || 0,
        referralCount: userData.referralCount || 0,
        totalEarnings: userData.totalEarnings || 0,
        lastActive: Date.now(),
        createdAt: userData.createdAt || Date.now(),
        vipExpiry: userData.vipExpiry ?? null,
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