import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Layout from './Layout';
import TabbedAdminPanel from './TabbedAdminPanel';
import SuperAdminPanel from './SuperAdminPanel';
import NetworkStatus from './NetworkStatus';
import { useFirebaseUser, createOrUpdateUser } from '../firebase/hooks';
import { User } from '../types/firebase';
import { getTelegramWebAppData, getTelegramUserPhoto } from '../services/telegram';
import { saveUserToStorage, getUserFromStorage } from '../utils/localStorage';

/**
 * SIMPLIFIED TELEGRAM WEBAPP - PRODUCTION READY
 * 
 * Key Changes Made:
 * 1. ✅ REMOVED: Complex step-by-step initialization loader
 * 2. ✅ REMOVED: Multiple loading states and spinners
 * 3. ✅ REMOVED: Retry logic and conditional rendering complexity
 * 4. ✅ KEPT: Full Telegram WebApp integration (user ID, username, profile pic)
 * 5. ✅ KEPT: Complete Firebase Realtime Database sync (read/write)
 * 6. ✅ KEPT: All existing features and data structures
 * 
 * How it works:
 * - App renders IMMEDIATELY with cached user data or sensible defaults
 * - Firebase sync happens silently in background without blocking UI
 * - Telegram WebApp integration works seamlessly
 * - All features remain fully functional
 */

function SimplifiedApp() {
  // Simple state - no complex loading states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Get Telegram data immediately (no waiting/polling)
  const telegramData = getTelegramWebAppData();
  const telegramUser = telegramData?.user;
  const userId = telegramUser?.id.toString() || null;

  // Firebase hook - handles background sync automatically
  const { user: firebaseUser } = useFirebaseUser(userId);

  // IMMEDIATE INITIALIZATION - No loading screens
  useEffect(() => {
    console.log('🚀 Simplified App: Immediate initialization');
    
    // Check URL parameters for admin access
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('admin') === 'true' || urlParams.get('superadmin') === 'true';
    
    if (isAdminMode) {
      // Create admin user immediately
      const adminUser: User = {
        id: 'admin-user',
        userId: telegramUser?.id.toString() || 'admin-demo',
        username: telegramUser?.username || 'admin',
        firstName: telegramUser?.first_name || 'Super',
        lastName: telegramUser?.last_name || 'Admin',
        coins: 999999,
        stars: 999999,
        tier: 'diamond',
        vipType: 'diamond',
        vipExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000),
        dailyWithdrawals: 0,
        referralCode: 'ADMIN001',
        totalReferrals: 0,
        farmingRate: 100,
        claimStreak: 0,
        claimedDays: [],
        badges: [],
        createdAt: Date.now(),
        lastActive: Date.now(),
        totalEarnings: 0,
        isVIP: true,
        banned: false,
        earningMultiplier: 10,
        boosts: 0,
        referralCount: 0,
        vip_tier: 'diamond',
        vip_expiry: Date.now() + (365 * 24 * 60 * 60 * 1000),
        multiplier: 10,
        withdraw_limit: 999999,
        referral_boost: 10
      };
      
      setIsAdmin(true);
      setCurrentUser(adminUser);
      return;
    }

    // For regular users - try to load from cache first for immediate rendering
    const cachedUser = getUserFromStorage();
    if (cachedUser && cachedUser.userId === userId) {
      console.log('📱 Loading cached user data for immediate rendering');
      setCurrentUser(cachedUser);
    }

    // Handle demo/external access
    if (!telegramUser && !cachedUser) {
      const demoUserId = urlParams.get('demo') || 'demo-user-001';
      const demoUser: User = {
        id: demoUserId,
        userId: demoUserId,
        username: `demo_${demoUserId}`,
        firstName: 'Demo',
        lastName: 'User',
        coins: 1000,
        stars: 50,
        tier: 'free',
        vipType: 'free',
        vipExpiry: null,
        dailyWithdrawals: 0,
        referralCode: `DEMO${Date.now().toString().slice(-4)}`,
        totalReferrals: 0,
        farmingRate: 10,
        claimStreak: 0,
        claimedDays: [],
        badges: [],
        createdAt: Date.now(),
        lastActive: Date.now(),
        totalEarnings: 0,
        isVIP: false,
        banned: false,
        earningMultiplier: 1,
        boosts: 0,
        referralCount: 0,
        vip_tier: 'free',
        vip_expiry: null,
        multiplier: 1,
        withdraw_limit: 1000,
        referral_boost: 1
      };
      
      setCurrentUser(demoUser);
      saveUserToStorage(demoUser);
    }
  }, [telegramUser, userId]);

  // BACKGROUND FIREBASE SYNC - No blocking, no loading states
  useEffect(() => {
    if (!telegramUser || !userId || isAdmin) return;

    const syncUserWithFirebase = async () => {
      try {
        if (firebaseUser) {
          // Update existing user with latest Telegram data
          console.log('🔄 Background sync: Updating existing user');
          
          // Get user photo in background (non-blocking)
          getTelegramUserPhoto(telegramUser.id).then(photoUrl => {
            const updatedUser: User = {
              ...firebaseUser,
              firstName: telegramUser.first_name || firebaseUser.firstName || 'User',
              lastName: telegramUser.last_name || firebaseUser.lastName || '',
              username: telegramUser.username || firebaseUser.username || `user_${telegramUser.id}`,
              photo_url: photoUrl || firebaseUser.photo_url,
              lastActive: Date.now()
            };
            
            // Update silently in background
            createOrUpdateUser(userId, updatedUser);
            setCurrentUser(updatedUser);
            saveUserToStorage(updatedUser);
          }).catch(() => {
            // Photo fetch failed, update without photo
            const updatedUser: User = {
              ...firebaseUser,
              firstName: telegramUser.first_name || firebaseUser.firstName || 'User',
              lastName: telegramUser.last_name || firebaseUser.lastName || '',
              username: telegramUser.username || firebaseUser.username || `user_${telegramUser.id}`,
              lastActive: Date.now()
            };
            
            createOrUpdateUser(userId, updatedUser);
            setCurrentUser(updatedUser);
            saveUserToStorage(updatedUser);
          });
        } else {
          // Create new user in background
          console.log('🆕 Background sync: Creating new user');
          
          const newUser: User = {
            id: userId,
            userId,
            username: telegramUser.username || `user_${telegramUser.id}`,
            firstName: telegramUser.first_name || 'User',
            lastName: telegramUser.last_name || '',
            coins: 1000,
            stars: 10,
            tier: 'free',
            vipType: 'free',
            vipExpiry: null,
            dailyWithdrawals: 0,
            referralCode: `REF${userId.slice(-6)}`,
            totalReferrals: 0,
            farmingRate: 10,
            claimStreak: 0,
            claimedDays: [],
            badges: [],
            createdAt: Date.now(),
            lastActive: Date.now(),
            totalEarnings: 0,
            isVIP: false,
            banned: false,
            earningMultiplier: 1,
            boosts: 0,
            referralCount: 0,
            vip_tier: 'free',
            vip_expiry: null,
            multiplier: 1,
            withdraw_limit: 1000,
            referral_boost: 1
          };

          // Create user in Firebase (background operation)
          createOrUpdateUser(userId, newUser).then(success => {
            if (success) {
              setCurrentUser(newUser);
              saveUserToStorage(newUser);
              toast.success(`Welcome ${newUser.firstName}!`, { duration: 3000 });
            }
          });

          // Set user immediately for UI rendering (don't wait for Firebase)
          setCurrentUser(newUser);
          saveUserToStorage(newUser);
        }
      } catch (error) {
        console.error('Background sync error (non-blocking):', error);
        // Don't show error to user - app continues working with cached data
      }
    };

    // Run background sync without blocking UI
    syncUserWithFirebase();
  }, [firebaseUser, telegramUser, userId, isAdmin]);

  // IMMEDIATE RENDER - No loading screens or conditional logic
  return (
    <div className="App">
      {/* Network status indicator */}
      <NetworkStatus />
      
      {/* Render appropriate panel immediately */}
      {isAdmin ? (
        (() => {
          const urlParams = new URLSearchParams(window.location.search);
          const isSuperAdmin = urlParams.get('superadmin') === 'true';
          
          if (isSuperAdmin && currentUser) {
            return <SuperAdminPanel adminUser={currentUser} />;
          } else {
            return <TabbedAdminPanel />;
          }
        })()
      ) : currentUser ? (
        <Layout />
      ) : (
        // Minimal fallback - only shown briefly while initial data loads
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
          <div className="glass-panel p-8 text-center max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-2">🌐 Mining Tech Bot</h2>
            <p className="text-gray-400 mb-4">Welcome! Loading your dashboard...</p>
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}
      
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
    </div>
  );
}

export default SimplifiedApp;