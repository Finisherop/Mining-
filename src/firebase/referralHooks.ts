// Referral Firebase Hooks
import { useState, useEffect } from 'react';
import { ref, get, set, onValue, off, push, update } from 'firebase/database';
import { database } from './config';

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referredUsername: string;
  username: string; // FIX: Add username property for compatibility
  joinedAt: number;
  totalEarnings: number;
  tier: 'free' | 'bronze' | 'diamond';
  active: boolean;
  lastActiveAt: number;
}

// Generate referral link with proper HTTPS URL
export const generateReferralLink = (userId: string, username: string): string => {
  // FIX: Generate proper HTTPS link instead of @ format
  const botUsername = 'Mining_tech_bot'; // Your actual bot username
  const referralCode = `ref_${userId}_${Date.now().toString().slice(-6)}`;
  
  // Create proper Telegram bot HTTPS link
  const httpsLink = `https://t.me/${botUsername}?start=${referralCode}`;
  
  console.log('✅ Generated HTTPS referral link:', httpsLink);
  return httpsLink;
};

// Hook to get user referrals from Firebase
export const useUserReferrals = (userId: string | null) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setReferrals([]);
      setLoading(false);
      return;
    }

    const referralsRef = ref(database, `referrals/${userId}`);
    
    const unsubscribe = onValue(referralsRef, (snapshot: any) => {
      try {
        if (snapshot.exists()) {
          const referralsData = snapshot.val();
          const referralsList = Object.keys(referralsData).map(key => ({
            id: key,
            ...referralsData[key]
          })) as Referral[];
          
          // Sort by joinedAt date (newest first)
          const sortedReferrals = referralsList.sort((a, b) => b.joinedAt - a.joinedAt);
          setReferrals(sortedReferrals);
        } else {
          setReferrals([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading referrals:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err: any) => {
      console.error('Firebase referrals error:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => off(referralsRef, 'value', unsubscribe);
  }, [userId]);

  return { referrals, loading, error };
};

// Add a new referral when someone joins
export const addReferral = async (
  referrerUserId: string,
  referredUserId: string,
  referredUsername: string
): Promise<boolean> => {
  try {
    const referralsRef = ref(database, `referrals/${referrerUserId}`);
    const newReferralRef = push(referralsRef);
    
    const referralData: Omit<Referral, 'id'> = {
      referrerUserId,
      referredUserId,
      referredUsername,
      username: referredUsername, // FIX: Set username same as referredUsername for compatibility
      joinedAt: Date.now(),
      totalEarnings: 0,
      tier: 'free',
      active: true,
      lastActiveAt: Date.now()
    };
    
    await set(newReferralRef, referralData);
    
    // Update referrer's total referral count
    const referrerRef = ref(database, `users/${referrerUserId}/totalReferrals`);
    const currentCount = await get(referrerRef);
    const newCount = (currentCount.val() || 0) + 1;
    await set(referrerRef, newCount);
    
    console.log('✅ Referral added successfully');
    return true;
  } catch (error) {
    console.error('❌ Error adding referral:', error);
    return false;
  }
};

// Update referral earnings when referred user earns
export const updateReferralEarnings = async (
  referredUserId: string,
  earningsToAdd: number
): Promise<boolean> => {
  try {
    // Find all referrers who referred this user
    const allReferralsRef = ref(database, 'referrals');
    const snapshot = await get(allReferralsRef);
    
    if (!snapshot.exists()) return true;
    
    const allReferrals = snapshot.val();
    
    // Find referrals where this user was referred
    for (const referrerUserId in allReferrals) {
      const referrerReferrals = allReferrals[referrerUserId];
      
      for (const referralId in referrerReferrals) {
        const referral = referrerReferrals[referralId];
        
        if (referral.referredUserId === referredUserId) {
          // Update the referral earnings (10% commission)
          const commission = Math.floor(earningsToAdd * 0.1);
          const updatedEarnings = referral.totalEarnings + commission;
          
          await update(ref(database, `referrals/${referrerUserId}/${referralId}`), {
            totalEarnings: updatedEarnings,
            lastActiveAt: Date.now(),
            active: true
          });
          
          // Also add commission to referrer's coins
          const referrerRef = ref(database, `users/${referrerUserId}/coins`);
          const referrerSnapshot = await get(referrerRef);
          const currentCoins = referrerSnapshot.val() || 0;
          await set(referrerRef, currentCoins + commission);
          
          console.log(`💰 Referral commission paid: ${commission} coins to ${referrerUserId}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating referral earnings:', error);
    return false;
  }
};

// Get referral statistics
export const getReferralStats = async (userId: string) => {
  try {
    const referralsRef = ref(database, `referrals/${userId}`);
    const snapshot = await get(referralsRef);
    
    if (!snapshot.exists()) {
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0
      };
    }
    
    const referrals = Object.values(snapshot.val()) as Referral[];
    const now = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    
    const stats = {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.active && (now - r.lastActiveAt) < 30 * 24 * 60 * 60 * 1000).length,
      totalEarnings: referrals.reduce((sum, r) => sum + r.totalEarnings, 0),
      thisMonthEarnings: referrals
        .filter(r => r.joinedAt >= monthStart)
        .reduce((sum, r) => sum + r.totalEarnings, 0)
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      activeReferrals: 0,
      totalEarnings: 0,
      thisMonthEarnings: 0
    };
  }
};