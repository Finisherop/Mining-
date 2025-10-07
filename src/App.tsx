import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
// Import Telegram types
import './utils/telegramPayments';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import TabbedAdminPanel from './components/TabbedAdminPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import NetworkStatus from './components/NetworkStatus';
import StepByStepLoader from './components/StepByStepLoader';
import { useFirebaseUser, createOrUpdateUser } from './firebase/hooks';
import { User } from './types/firebase';
import { getTelegramWebAppData, getTelegramUserPhoto } from './services/telegram';
import { saveUserToStorage } from './utils/localStorage';
import { isTelegramUser } from './utils/telegram';
import { getNetworkStatus, shouldShowSlowNetworkWarning, getNetworkRecommendations } from './utils/networkUtils';
import { motion } from 'framer-motion';

// App initialization states
type AppState = 'initializing' | 'ready' | 'error';

function App() {
  const [appState, setAppState] = useState<AppState>('initializing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // These will be set after step-by-step initialization
  const [telegramData, setTelegramData] = useState<any>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Firebase hooks - only initialize after step-by-step process
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseUser(userId);

  // Handle initialization completion
  const handleInitializationComplete = async () => {
    console.log('🎉 Step-by-step initialization completed, processing user data...');
    
    try {
      // Get Telegram data after initialization
      const telegramDataResult = getTelegramWebAppData();
      const telegramUserResult = telegramDataResult?.user;
      const userIdResult = telegramUserResult?.id.toString() || null;
      
      setTelegramData(telegramDataResult);
      setTelegramUser(telegramUserResult);
      setUserId(userIdResult);
      
      console.log('📱 Telegram data processed:', { telegramUserResult, userIdResult });
      
      // Process user type and admin access
      await processUserAccess(telegramDataResult, telegramUserResult);
      
    } catch (error) {
      console.error('❌ Error processing user data after initialization:', error);
      setErrorMessage('Failed to process user data');
      setAppState('error');
    }
  };

  // Handle initialization error
  const handleInitializationError = (error: string) => {
    console.error('❌ Initialization failed:', error);
    setErrorMessage(error);
    setAppState('error');
  };

  // Process user access and create user profiles
  const processUserAccess = async (telegramDataResult: any, telegramUserResult: any) => {
    try {
      // Handle access from other devices (non-Telegram)
      const urlParams = new URLSearchParams(window.location.search);
      const forceUserMode = urlParams.get('user') === 'true';
      
      // Admin access: URL param OR specific Telegram IDs
      const adminUserIds = [987654321]; // Updated with actual admin IDs
      const isAdminMode = !forceUserMode && (
        urlParams.get('admin') === 'true' || 
        urlParams.get('superadmin') === 'true' ||
        (telegramUserResult && adminUserIds.includes(telegramUserResult.id))
      );
      
      // Check if accessing from external device (no Telegram data)
      const isExternalDevice = !telegramUserResult && !telegramDataResult;
      const demoUserId = urlParams.get('demo') || 'demo-user-001';
      
      console.log('⚙️ Access mode analysis:', { forceUserMode, isAdminMode, isExternalDevice });
      
      if (isAdminMode) {
        await createAdminUser(telegramUserResult);
      } else if (isExternalDevice) {
        await createDemoUser(demoUserId);
      } else {
        // Will be handled by Firebase hooks when userId is set
        console.log('👤 Regular user mode - waiting for Firebase user data...');
      }
      
      setAppState('ready');
      
    } catch (error) {
      console.error('❌ Error processing user access:', error);
      throw error;
    }
  };

  // Create admin user
  const createAdminUser = async (telegramUserResult: any) => {
    console.log('🔧 Creating admin user...');
    setIsAdmin(true);
    
    const adminUser: User = {
      id: 'admin-user',
      userId: telegramUserResult?.id.toString() || 'admin-demo',
      username: telegramUserResult?.username || 'admin',
      firstName: telegramUserResult?.first_name || 'Super',
      lastName: telegramUserResult?.last_name || 'Admin',
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
    console.log('✅ Admin user created');
  };

  // Create demo user
  const createDemoUser = async (demoUserId: string) => {
    console.log('🌐 Creating demo user...');
    
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
    console.log('✅ Demo user created');
  };

  // Handle Firebase user changes (for regular Telegram users)
  useEffect(() => {
    if (firebaseUser && !isAdmin && appState === 'ready' && userId) {
      console.log('👤 Processing Firebase user data...');
      handleFirebaseUser(firebaseUser);
    }
  }, [firebaseUser, isAdmin, appState, userId]);

  // Handle Firebase user processing
  const handleFirebaseUser = async (user: User) => {
    try {
      let finalUser: User;
      
      if (telegramUser) {
        console.log('📝 Updating existing user with Telegram data...');
        // Get user photo
        const photoUrl = await getTelegramUserPhoto(telegramUser.id);
        
        // Update existing user with latest Telegram data
        finalUser = {
          ...user,
          firstName: telegramUser.first_name || user.firstName || 'User',
          lastName: telegramUser.last_name || user.lastName || '',
          username: telegramUser.username || user.username || `user_${telegramUser.id}`,
          photo_url: photoUrl || user.photo_url,
          lastActive: Date.now()
        };
        
        // Save/update in Firebase
        await createOrUpdateUser(telegramUser.id.toString(), finalUser);
      } else {
        finalUser = user;
      }
      
      setCurrentUser(finalUser);
      saveUserToStorage(finalUser);
      
      console.log('✅ Firebase user processed successfully:', finalUser.firstName);
    } catch (error) {
      console.error('❌ Error processing Firebase user:', error);
    }
  };

  // Create new Telegram user if no Firebase user exists
  useEffect(() => {
    if (!firebaseUser && !firebaseLoading && telegramUser && appState === 'ready' && !isAdmin) {
      console.log('🆕 Creating new Telegram user...');
      createNewTelegramUser();
    }
  }, [firebaseUser, firebaseLoading, telegramUser, appState, isAdmin]);

  // Create new Telegram user with enhanced error handling
  const createNewTelegramUser = async () => {
    try {
      console.log('🆕 Creating new user profile for Telegram ID:', telegramUser?.id);
      
      if (!telegramUser || !telegramUser.id) {
        console.error('❌ No valid Telegram user data available');
        return;
      }

      // Get user photo for new user (with timeout)
      let photoUrl: string | null = null;
      try {
        const photoPromise = getTelegramUserPhoto(telegramUser.id);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Photo fetch timeout')), 5000)
        );
        
        photoUrl = await Promise.race([photoPromise, timeoutPromise]);
      } catch (photoError) {
        console.warn('⚠️ Failed to get user photo, continuing without it:', photoError);
      }
      
      // Create comprehensive user data with all required fields
      const newUser: User = {
        id: telegramUser.id.toString(),
        userId: telegramUser.id.toString(),
        username: telegramUser.username || `user_${telegramUser.id}`,
        firstName: telegramUser.first_name || 'User',
        lastName: telegramUser.last_name || '',
        coins: 1000, // Starting coins
        stars: 10,   // Starting stars
        tier: 'free',
        vipType: 'free',
        vipExpiry: null,
        dailyWithdrawals: 0,
        referralCode: `REF${telegramUser.id.toString().slice(-6)}`,
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
        referral_boost: 1,
        photo_url: photoUrl || undefined
      };

      console.log('💾 Saving new user to Firebase:', {
        id: newUser.id,
        username: newUser.username,
        firstName: newUser.firstName
      });

      // Save in Firebase with retry logic
      const saveSuccess = await createOrUpdateUser(telegramUser.id.toString(), newUser);
      
      if (saveSuccess) {
        setCurrentUser(newUser);
        saveUserToStorage(newUser);
        console.log('✅ New user created successfully:', newUser.firstName);
        
        // Show welcome message
        toast.success(`Welcome ${newUser.firstName}! Your account has been created.`, {
          duration: 4000,
          id: 'welcome-new-user'
        });
      } else {
        console.error('❌ Failed to save new user to Firebase');
        toast.error('Failed to create user account. Please try again.', {
          duration: 5000,
          id: 'user-creation-error'
        });
      }
      
    } catch (error) {
      console.error('❌ Error creating new user:', error);
      toast.error('Error creating user account. Please refresh and try again.', {
        duration: 5000,
        id: 'user-creation-error'
      });
    }
  };

  // Sync user data with store on app load
  useEffect(() => {
    if (currentUser && appState === 'ready') {
      // Import store dynamically to avoid circular dependency
      import('./store').then(({ useAppStore }) => {
        const { setUser } = useAppStore.getState();
        setUser(currentUser);
        console.log('✅ User data synced with store');
      });
    }
  }, [currentUser, appState]);

  // Load additional data after UI is rendered (Step 6)
  useEffect(() => {
    if (appState === 'ready' && currentUser && !dataLoaded) {
      // Delay data loading to ensure UI is rendered first
      setTimeout(() => {
        console.log('📊 Loading additional data after UI render...');
        setDataLoaded(true);
        
        // Trigger data loading in components
        window.dispatchEvent(new CustomEvent('startDataLoading'));
        
        toast.success('Welcome! All features are now available.', {
          duration: 3000,
          id: 'welcome-toast'
        });
      }, 1000);
    }
  }, [appState, currentUser, dataLoaded]);

  // Render based on app state
  if (appState === 'initializing') {
    return (
      <StepByStepLoader
        onComplete={handleInitializationComplete}
        onError={handleInitializationError}
      />
    );
  }

  if (appState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 text-center max-w-md mx-4"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Initialization Failed</h2>
          <p className="text-gray-400 mb-6">
            {errorMessage || 'An error occurred during app initialization.'}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setAppState('initializing');
                setErrorMessage('');
                window.location.reload();
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
            >
              🔄 Retry Initialization
            </button>
            
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🗑️ Clear Cache & Reload
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show loading while waiting for user data (for regular users)
  if (appState === 'ready' && !currentUser && !isAdmin && userId && firebaseLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 text-center max-w-md mx-4"
        >
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Loading User Profile</h2>
          <p className="text-gray-400 mb-4">
            Retrieving your profile data...
          </p>
        </motion.div>
      </div>
    );
  }

  // Main app render (after successful initialization)
  return (
    <div className="App">
      {/* Network status indicator for device connectivity */}
      <NetworkStatus />
      
      {/* Render appropriate panel based on user type */}
      {isAdmin ? (
        (() => {
          const urlParams = new URLSearchParams(window.location.search);
          const isSuperAdmin = urlParams.get('superadmin') === 'true';
          
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
        // Fallback for cases where no user is available
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

export default App;