import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import SuperAdminPanel from './components/SuperAdminPanel';
import NetworkStatus from './components/NetworkStatus';
import { useFirebaseUser, createOrUpdateUser } from './firebase/hooks';
import { User } from './types/firebase';
import { getTelegramWebAppData, getTelegramUserPhoto } from './services/telegram';
import { saveUserToStorage } from './utils/localStorage';
import { isTelegramUser } from './utils/telegram';
import { motion } from 'framer-motion';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get Telegram user data
  const telegramData = getTelegramWebAppData();
  const telegramUser = telegramData?.user;
  const userId = telegramUser?.id.toString() || null;

  // Firebase hooks
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseUser(userId);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const forceUserMode = urlParams.get('user') === 'true';
        const adminUserIds = [6779644494, 987654321]; // Admin IDs
        const isAdminMode = !forceUserMode && (
          urlParams.get('admin') === 'true' || 
          urlParams.get('superadmin') === 'true' ||
          (telegramUser && adminUserIds.includes(telegramUser.id))
        );

        const isExternalDevice = !telegramUser && !telegramData;
        const demoUserId = urlParams.get('demo') || 'demo-user-001';

        if (isAdminMode) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        if (isExternalDevice) {
          const demoUser: User = {
            id: demoUserId,
            userId: demoUserId,
            username: `User${Math.floor(Math.random() * 1000)}`,
            coins: 1250,
            stars: 45,
            tier: 'free',
            isVIP: false,
            vip_tier: 'free',
            vip_expiry: null,
            multiplier: 1,
            withdraw_limit: 1,
            referral_boost: 1,
            dailyWithdrawals: 0,
            referralCode: `https://t.me/Mining_tech_bot?start=ref_${demoUserId}`,
            totalReferrals: 3,
            farmingRate: 10,
            claimStreak: 2,
            claimedDays: [1, 2],
            badges: [{
              type: 'bronze',
              name: 'Demo User',
              description: 'Accessing from external device',
              icon: '🌐',
              color: '#cd7f32',
              unlockedAt: Date.now()
            }],
            createdAt: Date.now(),
            lastActive: Date.now(),
            totalEarnings: 0,
            earningMultiplier: 1,
            boosts: 0,
            referralCount: 0,
            vipExpiry: null
          };

          setCurrentUser(demoUser);
          saveUserToStorage(demoUser);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(false);

        if (telegramUser && userId) {
          let userPhoto = '';
          try {
            userPhoto = await getTelegramUserPhoto(telegramUser.id) || '';
          } catch {}

          if (firebaseUser) {
            const updatedUser = {
              ...firebaseUser,
              username: telegramUser.username || telegramUser.first_name || firebaseUser.username,
              lastActive: Date.now(),
              photo_url: userPhoto
            };

            await createOrUpdateUser(userId, updatedUser);
            setCurrentUser(updatedUser);
          } else {
            const newUser: User = {
              id: userId,
              userId,
              username: telegramUser.username || telegramUser.first_name || 'User',
              coins: 100,
              stars: 0,
              tier: 'free',
              vipExpiry: null,
              dailyWithdrawals: 0,
              referralCode: `@Mining_tech_bot?start=${userId}`,
              totalReferrals: 0,
              farmingRate: 10,
              claimStreak: 0,
              claimedDays: [],
              badges: [],
              createdAt: Date.now(),
              lastActive: Date.now(),
              totalEarnings: 0,
              isVIP: false,
              earningMultiplier: 1,
              boosts: 0,
              referralCount: 0,
              vip_tier: 'free',
              vip_expiry: null,
              multiplier: 1,
              withdraw_limit: 1,
              referral_boost: 1,
              photo_url: userPhoto
            };

            await createOrUpdateUser(userId, newUser);
            setCurrentUser(newUser);
          }
        } else if (!telegramUser) {
          const demoUser: User = {
            id: 'demo_user',
            userId: 'demo_user',
            username: 'Demo User',
            coins: 500,
            stars: 25,
            tier: 'free',
            vipExpiry: null,
            dailyWithdrawals: 0,
            referralCode: '@Mining_tech_bot?start=demo_user',
            totalReferrals: 0,
            farmingRate: 10,
            claimStreak: 1,
            claimedDays: [1],
            badges: [],
            createdAt: Date.now(),
            lastActive: Date.now(),
            totalEarnings: 150,
            isVIP: false,
            earningMultiplier: 1,
            boosts: 0,
            referralCount: 0,
            vip_tier: 'free',
            vip_expiry: null,
            multiplier: 1,
            withdraw_limit: 1,
            referral_boost: 1,
            photo_url: ''
          };
          setCurrentUser(demoUser);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!firebaseLoading) initializeApp();
  }, [telegramUser, userId, firebaseUser, firebaseLoading]);

  useEffect(() => {
    if (firebaseUser && !isAdmin) {
      setCurrentUser(firebaseUser);
      saveUserToStorage(firebaseUser);
    }
  }, [firebaseUser, isAdmin]);

  useEffect(() => {
    if (currentUser) {
      import('./store').then(({ useAppStore }) => {
        const { setUser } = useAppStore.getState();
        setUser(currentUser);
      });
    }
  }, [currentUser]);

  if (loading || (isTelegramUser() && firebaseLoading)) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 text-center"
        >
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">
            {isAdmin ? 'Initializing admin panel' : 'Setting up your dashboard'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="App">
      <NetworkStatus />

      {isAdmin ? (
        (() => {
          const urlParams = new URLSearchParams(window.location.search);
          const isSuperAdmin = urlParams.get('superadmin') === 'true';
          return isSuperAdmin && currentUser ? (
            <SuperAdminPanel adminUser={currentUser} />
          ) : (
            <div className="min-h-screen flex items-center justify-center text-white">
              <p>No admin panel available.</p>
            </div>
          );
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
                <span className="text-purple-400">?superadmin=true</span> - Super Admin Panel
              </div>
              <div className="bg-gray-800/50 p-2 rounded">
                <span className="text-purple-400">?demo=myid</span> - Demo User
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Or access through Telegram bot for full features
            </p>
          </motion.div>
        </div>
      )}

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