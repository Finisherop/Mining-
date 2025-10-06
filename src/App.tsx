import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import { useFirebaseUser, useFirebaseUsers, createOrUpdateUser } from './firebase/hooks';
import { User } from './types/firebase';
import { getTelegramUser, isTelegramUser, initTelegramWebApp } from './utils/telegram';
import { getUserFromStorage, saveUserToStorage, syncUserData, needsSync } from './utils/localStorage';
import { motion } from 'framer-motion';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get Telegram user data
  const telegramUser = getTelegramUser();
  const userId = telegramUser?.id.toString() || null;

  // Firebase hooks
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseUser(userId);
  const { users: allUsers, loading: usersLoading } = useFirebaseUsers();

  // Initialize app
  useEffect(() => {
    initTelegramWebApp();
    
    const initializeApp = async () => {
      try {
        if (isTelegramUser() && telegramUser && userId) {
          // User Panel Mode
          setIsAdmin(false);
          
          // Check if we need to sync data
          if (needsSync() || !firebaseLoading) {
            const localUser = getUserFromStorage();
            
            if (firebaseUser || localUser) {
              // Sync between localStorage and Firebase
              const syncedUser = await syncUserData(userId, firebaseUser, createOrUpdateUser);
              if (syncedUser) {
                setCurrentUser(syncedUser);
              }
            } else {
              // Create new user
              const newUser: User = {
                userId,
                username: telegramUser.username || telegramUser.first_name || 'User',
                stars: 0,
                isVIP: false,
                earningMultiplier: 1,
                boosts: 0,
                referralCount: 0,
                totalEarnings: 0,
                lastActive: Date.now(),
                createdAt: Date.now(),
                vipExpiry: null
              };
              
              try {
                await createOrUpdateUser(userId, newUser);
                saveUserToStorage(newUser);
                setCurrentUser(newUser);
              } catch (firebaseError) {
                console.error('Firebase error, using local storage:', firebaseError);
                // Fallback to local storage if Firebase fails
                saveUserToStorage(newUser);
                setCurrentUser(newUser);
              }
            }
          } else if (firebaseUser) {
            setCurrentUser(firebaseUser);
          }
        } else {
          // Admin Panel Mode - check for admin access
          const isAdminAccess = window.location.search.includes('admin=true') || 
                               window.location.pathname.includes('admin') ||
                               !window.location.search; // Default to admin if no params
          setIsAdmin(isAdminAccess);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Set loading to false even on error to prevent infinite loading
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('App initialization timeout, forcing load completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    if (!firebaseLoading) {
      initializeApp();
    }

    return () => clearTimeout(timeoutId);
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
        <AdminPanel users={allUsers} loading={usersLoading} />
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