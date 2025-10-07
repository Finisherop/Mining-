import { useEffect, useState, useMemo, Suspense, lazy } from 'react';
import toast from 'react-hot-toast';
// Import Telegram types
import './utils/telegramPayments';
import { Toaster } from 'react-hot-toast';
import NetworkStatus from './components/NetworkStatus';
import { useFirebaseUser, createOrUpdateUser } from './firebase/hooks';
import { User } from './types/firebase';
import { getTelegramWebAppData, getTelegramUserPhoto } from './services/telegram';
import { saveUserToStorage } from './utils/localStorage';
import { isTelegramUser } from './utils/telegram';
import { createSafeUserData, extractSafeUserId } from './utils/firebaseSanitizer';
import { initializeSafeFirebaseConnection } from './firebase/safeConnection';
import { motion } from 'framer-motion';
import { useCachedData } from './hooks/useSmoothCounter';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better initial loading
const Layout = lazy(() => import('./components/Layout'));
const TabbedAdminPanel = lazy(() => import('./components/TabbedAdminPanel'));
const SuperAdminPanel = lazy(() => import('./components/SuperAdminPanel'));

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializationState, setInitializationState] = useState<{
    telegram: boolean;
    firebase: boolean;
    retryCount: number;
    lastRetry: number;
  }>({ telegram: false, firebase: false, retryCount: 0, lastRetry: 0 });

  // Get Telegram user data - memoized for performance
  const telegramData = useMemo(() => getTelegramWebAppData(), []);
  const telegramUser = telegramData?.user;
  const userId = telegramUser?.id.toString() || null;

  // Firebase hooks with caching
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseUser(userId);
  
  // Cache user data for instant loading
  const { data: cachedUser, isLoading: cacheLoading } = useCachedData(
    `user_${userId || 'anonymous'}`,
    async () => {
      if (!userId) return null;
      // This will be populated by the Firebase hook
      return firebaseUser;
    },
    { 
      cacheTime: 10 * 60 * 1000, // 10 minutes
      staleTime: 2 * 60 * 1000,  // 2 minutes
      backgroundRefresh: true 
    }
  );

  // Determine access mode early for instant UI rendering
  const accessMode = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const forceUserMode = urlParams.get('user') === 'true';
    const adminUserIds = [987654321];
    
    const isAdminMode = !forceUserMode && (
      urlParams.get('admin') === 'true' || 
      urlParams.get('superadmin') === 'true' ||
      (telegramUser && adminUserIds.includes(telegramUser.id))
    );
    
    const isExternalDevice = !telegramUser && !telegramData;
    const isSuperAdmin = urlParams.get('superadmin') === 'true';
    
    return {
      isAdmin: isAdminMode,
      isSuperAdmin,
      isExternalDevice,
      forceUserMode
    };
  }, [telegramUser, telegramData]);

  // Fast initialization - render UI immediately, fetch data in background
  useEffect(() => {
    // Set admin mode immediately for instant UI
    if (accessMode.isAdmin) {
      setIsAdmin(true);
      setLoading(false); // Allow admin UI to render immediately
    }
    
    const initializeApp = async () => {
      try {
        // Check Telegram WebApp availability
        const telegramAvailable = window.Telegram?.WebApp !== undefined;
        console.log(telegramAvailable ? '🚀 Telegram WebApp detected, initializing…' : '🌐 Web browser mode detected');
        
        // SAFE: Initialize Firebase connection with retry logic
        console.log('🔥 Initializing safe Firebase connection...');
        const firebaseConnected = await initializeSafeFirebaseConnection();
        console.log(firebaseConnected ? '✅ Firebase connected successfully with safe methods.' : '⚠️ Firebase connection failed, will retry...');
        
        setInitializationState(prev => ({
          ...prev,
          telegram: telegramAvailable,
          firebase: firebaseConnected
        }));
        
        console.log('🚀 Initializing app...');
        console.log('📱 Telegram data:', telegramData);
        console.log('👤 Telegram user:', telegramUser);
        console.log('🆔 User ID:', userId);
        
        // INSTANT UI: Load cached user data immediately for instant rendering
        const cachedUserData = localStorage.getItem('userData');
        if (cachedUserData && !currentUser) {
          try {
            const cached = JSON.parse(cachedUserData);
            const cacheAge = Date.now() - (cached.lastSync || 0);
            
            // Use cached data if less than 5 minutes old for instant UI
            if (cacheAge < 5 * 60 * 1000) {
              console.log('📦 Loading cached user data for instant UI rendering');
              setCurrentUser(cached);
            }
          } catch (e) {
            console.warn('⚠️ Invalid cached user data, proceeding with fresh fetch');
          }
        }
        
        // Use memoized access mode for consistency
        const { isAdmin: isAdminMode, isSuperAdmin, isExternalDevice, forceUserMode } = accessMode;
        const demoUserId = new URLSearchParams(window.location.search).get('demo') || 'demo-user-001';
        
        console.log('⚙️ Force user mode:', forceUserMode);
        console.log('👑 Is admin mode:', isAdminMode);
        console.log('📱 Is external device:', isExternalDevice);
        
        if (isAdminMode) {
          console.log('🔧 Setting admin mode');
          setIsAdmin(true);
          
          // SAFE: Create admin user with sanitized data
          const telegramUserData = telegramUser ? {
            id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name
          } : null;
          
          const adminUser: User = telegramUserData 
            ? createSafeUserData(telegramUserData, {
                coins: 999999,
                stars: 999999,
                tier: 'diamond',
                vipType: 'diamond',
                vipExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
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
              })
            : {
                id: 'admin-demo',
                userId: 'admin-demo',
                username: 'admin',
                firstName: 'Super',
                lastName: 'Admin',
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
          
          setCurrentUser(adminUser);
          setLoading(false);
          return;
        }

        // Handle external device access with demo user
        if (isExternalDevice) {
          console.log('🌐 External device detected - creating demo user');
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
          setLoading(false);
          return;
        }

        // SAFE: Handle Telegram user (existing or new) with sanitized data
        if (telegramUser) {
          console.log('👤 Processing Telegram user with safe methods...');
          
          let finalUser: User;
          
          if (firebaseUser) {
            console.log('📝 Updating existing user profile with safe data...');
            // Get user photo
            const photoUrl = await getTelegramUserPhoto(telegramUser.id);
            
            // SAFE: Update existing user with sanitized Telegram data
            finalUser = createSafeUserData(telegramUser, {
              ...firebaseUser,
              photo_url: photoUrl || firebaseUser.photo_url,
              lastActive: Date.now()
            });
          } else {
            console.log('🆕 Creating new user profile with safe methods...');
            // Get user photo for new user
            const photoUrl = await getTelegramUserPhoto(telegramUser.id);
            
            // SAFE: Create completely new user with sanitized data
            finalUser = createSafeUserData(telegramUser, {
              coins: 1000, // Starting coins
              stars: 10,   // Starting stars
              tier: 'free',
              vipType: 'free',
              vipExpiry: null,
              dailyWithdrawals: 0,
              totalReferrals: 0,
              farmingRate: 10,
              claimStreak: 0,
              claimedDays: [],
              badges: [],
              createdAt: Date.now(),
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
              referral_boost: 1,
              photo_url: photoUrl || undefined
            });
          }

          // SAFE: Save/update in Firebase using sanitized methods
          console.log('🔒 Saving user data with safe Firebase methods...');
          await createOrUpdateUser(telegramUser.id.toString(), finalUser);
          setCurrentUser(finalUser);
          saveUserToStorage(finalUser);
          
          console.log('✅ User processed successfully with safe methods:', finalUser.firstName);
        } else if (firebaseUser && !telegramUser) {
          // Handle case where Firebase user exists but no Telegram data
          console.log('📱 Using existing Firebase user without Telegram');
          setCurrentUser(firebaseUser);
          saveUserToStorage(firebaseUser);
        } else if (!telegramUser && !firebaseUser && !isExternalDevice) {
          // Create fallback demo user for web access
          console.log('🌐 Creating fallback demo user for web access');
          const fallbackUser: User = {
            id: 'web-demo-user',
            userId: 'web-demo-user',
            username: 'WebUser',
            firstName: 'Web',
            lastName: 'User',
            coins: 500,
            stars: 25,
            tier: 'free',
            vipType: 'free',
            vipExpiry: null,
            dailyWithdrawals: 0,
            referralCode: 'WEBDEMO',
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
          
          setCurrentUser(fallbackUser);
          saveUserToStorage(fallbackUser);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        
        // Auto-retry on error
        const now = Date.now();
        if (initializationState.retryCount < 5 && now - initializationState.lastRetry > 3000) {
          console.log('🔄 Initialization retry due to slow network.');
          
          // Show toast notification for retry
          toast.loading(`Retrying connection... (${initializationState.retryCount + 1}/5)`, {
            id: 'retry-toast',
            duration: 2500
          });
          
          setInitializationState(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1,
            lastRetry: now
          }));
          
          // Retry after 3 seconds
          setTimeout(() => {
            if (!firebaseLoading) {
              initializeApp();
            }
          }, 3000);
        }
      } finally {
        // Only set loading to false if both Telegram and Firebase are ready or max retries reached
        if ((initializationState.telegram || !window.Telegram?.WebApp) && 
            (initializationState.firebase || initializationState.retryCount >= 5)) {
          setLoading(false);
        }
      }
    };

    if (!firebaseLoading) {
      initializeApp();
    }
  }, [telegramUser, userId, firebaseUser, firebaseLoading, initializationState.retryCount]);

  // Update current user when Firebase user changes
  useEffect(() => {
    if (firebaseUser && !isAdmin) {
      setCurrentUser(firebaseUser);
      saveUserToStorage(firebaseUser);
    }
  }, [firebaseUser, isAdmin]);

  // Sync user data with store on app load
  useEffect(() => {
    if (currentUser) {
      // Import store dynamically to avoid circular dependency
      import('./store').then(({ useAppStore }) => {
        const { setUser } = useAppStore.getState();
        setUser(currentUser);
        console.log('✅ User data synced with store');
      });
    }
  }, [currentUser]);

  // Enhanced loading state with retry options
  if (loading || (isTelegramUser() && firebaseLoading)) {
    const showRetryOption = initializationState.retryCount >= 3 && Date.now() - initializationState.lastRetry > 8000;
    
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 text-center max-w-md mx-4"
        >
          {!showRetryOption ? (
            <>
              <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
              <p className="text-gray-400 mb-4">
                {isAdmin ? 'Initializing admin panel' : 'Setting up your dashboard'}
              </p>
              
              {/* Initialization status */}
              <div className="space-y-2 text-sm">
                <div className={`flex items-center justify-between p-2 rounded ${initializationState.telegram ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
                  <span>Telegram WebApp</span>
                  <span className={initializationState.telegram ? 'text-green-400' : 'text-yellow-400'}>
                    {initializationState.telegram ? '✓' : '⏳'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-2 rounded ${initializationState.firebase ? 'bg-green-900/30' : 'bg-yellow-900/30'}`}>
                  <span>Firebase Connection</span>
                  <span className={initializationState.firebase ? 'text-green-400' : 'text-yellow-400'}>
                    {initializationState.firebase ? '✓' : '⏳'}
                  </span>
                </div>
              </div>
              
              {initializationState.retryCount > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  Retry attempt {initializationState.retryCount}/5
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🔄</div>
              <h2 className="text-xl font-bold text-white mb-2">Slow Network Detected</h2>
              <p className="text-gray-400 mb-6">
                The app is taking longer than usual to load. This might be due to a slow network connection.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setInitializationState({ telegram: false, firebase: false, retryCount: 0, lastRetry: 0 });
                    setLoading(true);
                    window.location.reload();
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
                >
                  🔄 Retry Loading
                </button>
                
                <button
                  onClick={() => {
                    setLoading(false);
                  }}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ⚡ Continue Anyway
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                If issues persist, try clearing your browser cache
              </p>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {/* Network status indicator for device connectivity */}
        <NetworkStatus />
        
        <Suspense fallback={
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 text-center"
          >
            <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Loading Dashboard...</h2>
            <p className="text-gray-400">Preparing your experience</p>
          </motion.div>
        </div>
      }>
        {isAdmin ? (
          (() => {
            // Use memoized access mode
            const { isSuperAdmin } = accessMode;
            
            // Debug logs
            console.log('🔍 Admin panel render:', { isAdmin, isSuperAdmin, currentUser: !!currentUser });
            
            if (isSuperAdmin && currentUser) {
              console.log('🚀 Rendering SuperAdminPanel');
              return <SuperAdminPanel adminUser={currentUser} />;
            } else {
              console.log('📊 Rendering TabbedAdminPanel');
              return <TabbedAdminPanel />;
            }
          })()
        ) : currentUser ? (
          <Layout />
        ) : (
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 text-center max-w-md mx-4"
          >
            <h2 className="text-xl font-bold text-white mb-2">🌐 Welcome to Mining Tech Bot!</h2>
            <p className="text-gray-400 mb-4">
              Access from any device! Use the URL parameters below:
            </p>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-800/50 p-2 rounded">
                <span className="text-blue-400">?user=true</span> - User Panel
              </div>
              <div className="bg-gray-800/50 p-2 rounded">
                <span className="text-green-400">?admin=true</span> - Admin Panel
              </div>
              <div className="bg-gray-800/50 p-2 rounded">
                <span className="text-purple-400">?superadmin=true</span> - Super Admin Panel
              </div>
              <div className="bg-gray-800/50 p-2 rounded">
                <span className="text-purple-400">?demo=myid</span> - Demo User
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Or access through Telegram bot for full features
            </p>
            <div className="mt-6 space-y-2">
              <button
                onClick={() => window.location.href = '?user=true'}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors"
              >
                🚀 Launch User Panel
              </button>
              <button
                onClick={() => window.location.href = '?admin=true'}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors"
              >
                🔧 Launch Admin Panel
              </button>
              <button
                onClick={() => window.location.href = '?superadmin=true'}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
              >
                👑 Launch Super Admin Panel
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </Suspense>
      
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
    </ErrorBoundary>
  );
}

export default App;