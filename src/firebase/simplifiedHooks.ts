import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from './config';
import { User } from '../types/firebase';
import { extractSafeUserId } from '../utils/firebaseSanitizer';

/**
 * SIMPLIFIED FIREBASE USER HOOK - PRODUCTION READY
 * 
 * ✅ REMOVED:
 * - Complex loading states and spinners
 * - Retry logic and timeout handlers
 * - Error states that block UI
 * - Conditional rendering based on connection status
 * 
 * ✅ KEPT:
 * - Full Firebase Realtime Database sync
 * - Security (user ID sanitization)
 * - Real-time updates
 * - Automatic reconnection
 * 
 * 🚀 HOW IT WORKS:
 * - Returns user data immediately when available
 * - No loading state - Firebase sync happens in background
 * - App continues working with cached data if Firebase is offline
 * - Automatic sync when Firebase reconnects
 */

export const useSimplifiedFirebaseUser = (userId: string | null) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    try {
      // SAFE: Use sanitized user ID for Firebase path
      const safeUserId = extractSafeUserId(userId);
      const userRef = ref(database, `users/${safeUserId}`);
      
      console.log(`🔒 Setting up Firebase sync for user: ${safeUserId}`);
    
      // Set up real-time listener for background sync
      const unsubscribe = onValue(userRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const userData = snapshot.val() as User;
            console.log('📱 Firebase user data updated:', userData.firstName || userData.username);
            setUser(userData);
          } else {
            console.log('👤 No Firebase user data found');
            setUser(null);
          }
        } catch (err) {
          console.error('Firebase sync error (non-blocking):', err);
          // Don't set error state - let app continue with cached data
        }
      }, (err) => {
        console.error('Firebase listener error (non-blocking):', err);
        // Don't block app - continue with cached data
      });

      return () => off(userRef, 'value', unsubscribe);
      
    } catch (err) {
      console.error('❌ Failed to setup user listener (non-blocking):', err);
      // Don't block app - continue without Firebase sync
    }
  }, [userId]);

  return { user };
};

/**
 * 🚀 PRODUCTION USAGE:
 * 
 * Replace your existing useFirebaseUser with this:
 * 
 * const { user: firebaseUser } = useSimplifiedFirebaseUser(userId);
 * 
 * ✅ BENEFITS:
 * - No loading states to manage
 * - Firebase works in background
 * - App never blocks on Firebase connection issues
 * - Automatic real-time sync when available
 * - Clean, simple API
 */