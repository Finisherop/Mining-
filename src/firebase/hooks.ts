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

    try {
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
          console.warn('Firebase read error:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      }, (err) => {
        console.warn('Firebase connection error:', err);
        setError(err.message);
        setLoading(false);
      });

      return () => {
        try {
          off(userRef, 'value', unsubscribe);
        } catch (err) {
          console.warn('Firebase cleanup error:', err);
        }
      };
    } catch (err) {
      console.warn('Firebase initialization error:', err);
      setError(err instanceof Error ? err.message : 'Firebase connection failed');
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
    try {
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
          console.warn('Firebase users read error:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      }, (err) => {
        console.warn('Firebase users connection error:', err);
        setError(err.message);
        setLoading(false);
      });

      return () => {
        try {
          off(usersRef, 'value', unsubscribe);
        } catch (err) {
          console.warn('Firebase users cleanup error:', err);
        }
      };
    } catch (err) {
      console.warn('Firebase users initialization error:', err);
      setError(err instanceof Error ? err.message : 'Firebase connection failed');
      setLoading(false);
    }
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
        vipExpiry: userData.vipExpiry || null,
        ...userData
      };
    }
    
    await set(userRef, finalUserData);
    console.log('User data saved to Firebase:', finalUserData);
  } catch (error) {
    console.warn('Error creating/updating user (Firebase may not be configured):', error);
    // Don't throw error in development mode
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

// Function to update specific user field
export const updateUserField = async (userId: string, field: keyof User, value: any): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}/${field}`);
    await set(userRef, value);
    console.log(`Updated ${field} for user ${userId}:`, value);
  } catch (error) {
    console.warn('Error updating user field (Firebase may not be configured):', error);
    // Don't throw error in development mode
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

// Function to purchase VIP
export const purchaseVIP = async (userId: string, starCost: number = 100): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      console.warn('User not found in Firebase, using localStorage');
      return false;
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
    console.log('VIP purchased successfully for user:', userId);
    return true;
  } catch (error) {
    console.warn('Error purchasing VIP (Firebase may not be configured):', error);
    // Don't throw error in development mode
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return false;
  }
};