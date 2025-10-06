// VIP Management Firebase Hooks
import { useState, useEffect } from 'react';
import { ref, get, set, push, onValue, off, update } from 'firebase/database';
import { database } from './config';
import { VipPurchaseRequest, VipActivation } from '../types/vip';
import { User } from '../types/firebase';

// Hook for VIP purchase requests
export const useVipRequests = () => {
  const [requests, setRequests] = useState<Record<string, VipPurchaseRequest>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestsRef = ref(database, 'vipRequests');
    
    const unsubscribe = onValue(requestsRef, (snapshot: any) => { // <-- ERROR FIX: Add explicit type for Firebase callback
      try {
        if (snapshot.exists()) {
          setRequests(snapshot.val());
        } else {
          setRequests({});
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

    return () => off(requestsRef, 'value', unsubscribe);
  }, []);

  return { requests, loading, error };
};

// Create VIP purchase request
export const createVipRequest = async (request: Omit<VipPurchaseRequest, 'id'>): Promise<string | null> => {
  try {
    const requestsRef = ref(database, 'vipRequests');
    const newRequestRef = push(requestsRef);
    
    const vipRequest: VipPurchaseRequest = {
      ...request,
      id: newRequestRef.key!,
    };
    
    await set(newRequestRef, vipRequest);
    console.log('✅ VIP request created:', newRequestRef.key);
    return newRequestRef.key;
  } catch (error) {
    console.error('❌ Error creating VIP request:', error);
    return null;
  }
};

// Approve VIP request and activate VIP
export const approveVipRequest = async (
  requestId: string, 
  adminNotes?: string
): Promise<boolean> => {
  try {
    const requestRef = ref(database, `vipRequests/${requestId}`);
    const snapshot = await get(requestRef);
    
    if (!snapshot.exists()) {
      throw new Error('VIP request not found');
    }
    
    const request = snapshot.val() as VipPurchaseRequest;
    
    // Update request status
    await update(requestRef, {
      status: 'approved',
      processedAt: Date.now(),
      adminNotes: adminNotes || 'Approved by admin'
    });
    
    // Activate VIP for user
    const success = await activateVipForUser(request.userId, request.tier, 'admin');
    
    if (success) {
      console.log('✅ VIP request approved and activated:', requestId);
      return true;
    } else {
      // Rollback request status if activation failed
      await update(requestRef, {
        status: 'pending',
        processedAt: null,
        adminNotes: null
      });
      return false;
    }
  } catch (error) {
    console.error('❌ Error approving VIP request:', error);
    return false;
  }
};

// Reject VIP request
export const rejectVipRequest = async (
  requestId: string, 
  adminNotes: string
): Promise<boolean> => {
  try {
    const requestRef = ref(database, `vipRequests/${requestId}`);
    
    await update(requestRef, {
      status: 'rejected',
      processedAt: Date.now(),
      adminNotes
    });
    
    console.log('✅ VIP request rejected:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error rejecting VIP request:', error);
    return false;
  }
};

// Activate VIP for user
export const activateVipForUser = async (
  userId: string, 
  tier: 'bronze' | 'diamond',
  activatedBy: 'admin' | 'payment' = 'admin'
): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error('User not found');
    }
    
    // const user = snapshot.val() as User;
    const now = Date.now();
    const duration = 30; // 30 days
    const expiresAt = now + (duration * 24 * 60 * 60 * 1000);
    
    // Update user with VIP status
    const updatedUser: Partial<User> = {
      tier,
      vip_tier: tier,
      vip_expiry: expiresAt,
      vipExpiry: expiresAt,
      multiplier: tier === 'bronze' ? 2 : 2.5,
      withdraw_limit: tier === 'bronze' ? 3 : 5,
      referral_boost: tier === 'bronze' ? 1 : 1.5,
      lastActive: now
    };
    
    await update(userRef, updatedUser);
    
    // Log VIP activation
    const activationRef = ref(database, `vipActivations/${userId}_${now}`);
    const activation: VipActivation = {
      userId,
      tier,
      activatedBy,
      activatedAt: now,
      expiresAt,
      duration
    };
    
    await set(activationRef, activation);
    
    console.log('✅ VIP activated for user:', userId, tier);
    return true;
  } catch (error) {
    console.error('❌ Error activating VIP:', error);
    return false;
  }
};

// Check and update expired VIP users
export const checkExpiredVipUsers = async (): Promise<void> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return;
    
    const users = snapshot.val() as Record<string, User>;
    const now = Date.now();
    
    for (const [userId, user] of Object.entries(users)) {
      if (user.vip_expiry && user.vip_expiry < now && user.vip_tier !== 'free') {
        // Expire VIP
        await update(ref(database, `users/${userId}`), {
          tier: 'free',
          vip_tier: 'free',
          vip_expiry: null,
          vipExpiry: null,
          multiplier: 1,
          withdraw_limit: 1,
          referral_boost: 1,
          lastActive: now
        });
        
        console.log('⏰ VIP expired for user:', userId);
      }
    }
  } catch (error) {
    console.error('❌ Error checking expired VIP users:', error);
  }
};