/**
 * SIMPLIFIED FIREBASE REALTIME DATABASE HOOKS
 * 
 * Fixed to use Firebase Realtime Database instead of Firestore
 * Handles background sync without blocking UI rendering
 */

import { useEffect, useState } from 'react';
import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from './config';
import { User } from '../types/firebase';

// Custom hook for Firebase user data with background sync
export const useFirebaseUser = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Changed: No initial loading state

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.log(`🔄 Setting up Firebase sync for user: ${userId}`);
    
    const userRef = ref(database, `users/${userId}`);
    
    // Set up real-time listener for background sync
    const unsubscribe = onValue(userRef, (snapshot) => {
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
    }, (err) => {
      console.error('Firebase listener error (non-blocking):', err);
      setLoading(false);
      // Don't block app - continue with cached data
    });

    return () => off(userRef, 'value', unsubscribe);
  }, [userId]);

  return { user, loading };
};

// Function to create or update user in Realtime Database
export const createOrUpdateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
  try {
    console.log(`💾 Saving user data to Firebase: ${userId}`);
    
    // Validate userId
    if (!userId || userId === 'null' || userId === 'undefined') {
      console.error('❌ Invalid userId provided:', userId);
      return false;
    }

    const userRef = ref(database, `users/${userId}`);
    
    let finalUserData: User;
    
    try {
      // Try to get existing data
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        // Update existing user
        const existingData = snapshot.val() as User;
        finalUserData = { 
          ...existingData, 
          ...userData,
          lastActive: Date.now()
        };
        console.log('📝 Updating existing user data');
      } else {
        // Create new user with comprehensive defaults
        finalUserData = {
          id: userId,
          userId,
          username: userData.username || userData.firstName || `user_${userId.slice(-6)}`,
          firstName: userData.firstName || 'User',
          lastName: userData.lastName || '',
          stars: userData.stars || 10,
          coins: userData.coins || 1000,
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
          ...userData
        };
        console.log('🆕 Creating new user with defaults');
      }
      
      // Save to Firebase Realtime Database
      await set(userRef, finalUserData);
      console.log(`✅ User ${userId} saved successfully to Realtime Database`);
      return true;
      
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);
      return false;
    }
    
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
    console.log(`✅ Updated ${field} for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error updating user field ${field}:`, error);
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
    console.log(`✅ VIP purchased for user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error purchasing VIP:', error);
    throw error;
  }
};