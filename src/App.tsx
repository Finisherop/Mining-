import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import { useFirebaseUser, useFirebaseUsers, createOrUpdateUser } from './firebase/hooks';
import { User } from './types/firebase';
import { getTelegramUser, isTelegramUser, initTelegramWebApp } from './utils/telegram';
import { getUserFromStorage, saveUserToStorage } from './utils/localStorage';
import { motion } from 'framer-motion';

// Generate demo users for admin panel when Firebase is not available
const generateDemoUsers = () => {
  const demoUsers: Record<string, User> = {
    '123456789': {
      userId: '123456789',
      username: 'john_doe',
      stars: 150,
      isVIP: true,
      earningMultiplier: 2,
      boosts: 3,
      referralCount: 5,
      totalEarnings: 2500,
      lastActive: Date.now() - 60000,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      vipExpiry: Date.now() + 15 * 24 * 60 * 60 * 1000
    },
    '987654321': {
      userId: '987654321',
      username: 'jane_smith',
      stars: 75,
      isVIP: false,
      earningMultiplier: 1,
      boosts: 1,
      referralCount: 2,
      totalEarnings: 800,
      lastActive: Date.now() - 300000,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      vipExpiry: null
    },
    '456789123': {
      userId: '456789123',
      username: 'demo_user',
      stars: 200,
      isVIP: true,
      earningMultiplier: 2.5,
      boosts: 5,
      referralCount: 8,
      totalEarnings: 4200,
      lastActive: Date.now() - 120000,
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
      vipExpiry: Date.now() + 25 * 24 * 60 * 60 * 1000
    }
  };
  
  console.log('Using demo users for admin panel');
  return demoUsers;
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get Telegram user data
  const telegramUser = getTelegramUser();
  const userId = telegramUser?.id.toString() || null;

  // Firebase hooks
  const { user: firebaseUser, loading: firebaseLoading, error: firebaseError } = useFirebaseUser(userId);
  const { users: allUsers, loading: usersLoading, error: usersError } = useFirebaseUsers();

  // Initialize app
  useEffect(() => {
    initTelegramWebApp();
    
    const initializeApp = async () => {
      try {
        if (isTelegramUser() && telegramUser && userId) {
          // User Panel Mode
          setIsAdmin(false);
          
          // Check localStorage first
          const localUser = getUserFromStorage();
          
          if (localUser) {
            // Use local data immediately
            setCurrentUser(localUser);
            console.log('Using localStorage data for user:', localUser.username);
          } else if (firebaseUser && !firebaseError) {
            // Use Firebase data if available
            setCurrentUser(firebaseUser);
            saveUserToStorage(firebaseUser);
            console.log('Using Firebase data for user:', firebaseUser.username);
          } else {
            // Create new user (works with or without Firebase)
            const newUser: User = {
              userId,
              username: telegramUser.username || telegramUser.first_name || 'User',
              stars: 100, // Give some stars for demo
              isVIP: false,
              earningMultiplier: 1,
              boosts: 0,
              referralCount: 0,
              totalEarnings: 0,
              lastActive: Date.now(),
              createdAt: Date.now(),
              vipExpiry: null
            };
            
            // Try to save to Firebase, but don't fail if it doesn't work
            try {
              if (!firebaseError) {
                await createOrUpdateUser(userId, newUser);
              }
            } catch (err) {
              console.warn('Could not save to Firebase, using localStorage only:', err);
            }
            
            saveUserToStorage(newUser);
            setCurrentUser(newUser);
            console.log('Created new user:', newUser.username);
          }
        } else {
          // Admin Panel Mode
          setIsAdmin(true);
          console.log('Admin panel mode activated');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        
        // Fallback: create a demo user if everything fails
        if (isTelegramUser() && telegramUser && userId) {
          const fallbackUser: User = {
            userId,
            username: telegramUser.username || telegramUser.first_name || 'User',
            stars: 100,
            isVIP: false,
            earningMultiplier: 1,
            boosts: 0,
            referralCount: 0,
            totalEarnings: 0,
            lastActive: Date.now(),
            createdAt: Date.now(),
            vipExpiry: null
          };
          setCurrentUser(fallbackUser);
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      } finally {
        setLoading(false);
      }
    };

    if (!firebaseLoading) {
      initializeApp();
    }
  }, [telegramUser, userId, firebaseUser, firebaseLoading]);

  // Update current user when Firebase user changes
  useEffect(() => {
    if (firebaseUser && !isAdmin) {
      setCurrentUser(firebaseUser);
      saveUserToStorage(firebaseUser);
    }
  }, [firebaseUser, isAdmin]);

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    saveUserToStorage(updatedUser);
  };

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
      {isAdmin ? (
        <AdminPanel users={usersError ? generateDemoUsers() : allUsers} loading={usersLoading} />
      ) : currentUser ? (
        <UserPanel user={currentUser} onUserUpdate={handleUserUpdate} />
      ) : (
        <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 text-center"
          >
            <h2 className="text-xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-gray-400">
              Please open this app through the Telegram bot to access your dashboard.
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