import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Crown, 
  Zap, 
  Users, 
  TrendingUp, 
  Gift,
  Clock,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { User } from '../types/firebase';
import { purchaseVIP } from '../firebase/hooks';
import { saveUserToStorage } from '../utils/localStorage';
import { showTelegramAlert, hapticFeedback } from '../utils/telegram';
import { cn, formatNumber, triggerConfetti } from '../utils';
import toast from 'react-hot-toast';

interface SimplifiedUserPanelProps {
  user: User;
  onUserUpdate: (user: User) => void;
}

/**
 * SIMPLIFIED USER PANEL - PRODUCTION READY
 * 
 * ✅ REMOVED:
 * - Complex loading states and spinners for initial panel load
 * - Background API polling and retries
 * - Conditional rendering based on loading states
 * - setTimeout/setInterval for data fetching
 * - Multiple useEffect hooks for initialization
 * 
 * ✅ KEPT:
 * - Full Telegram WebApp integration (user ID, username, profile pic)
 * - Complete Firebase Realtime Database sync (read/write)
 * - All existing features (VIP purchase, earnings, stats)
 * - Real-time earnings calculation
 * - All UI components and animations
 * - All data structures and types
 * 
 * 🚀 HOW IT WORKS:
 * - Panel renders IMMEDIATELY when user prop is available
 * - Firebase sync happens automatically via hooks (no manual loading)
 * - Only VIP purchase action has loading state (user-initiated)
 * - Real-time earnings continue working as before
 * - All features remain fully functional
 */

const SimplifiedUserPanel: React.FC<SimplifiedUserPanelProps> = ({ user, onUserUpdate }) => {
  // ✅ SIMPLIFIED: Only loading state needed is for user actions (VIP purchase)
  const [isVipPurchasing, setIsVipPurchasing] = useState(false);
  
  // ✅ KEPT: Real-time earnings calculation (this is a feature, not loading logic)
  const [earnings, setEarnings] = useState(0);

  // ✅ SIMPLIFIED: Real-time earnings - runs immediately, no loading checks
  useEffect(() => {
    // Load cached earnings immediately for smooth UX
    const cachedEarnings = localStorage.getItem(`earnings_${user.userId}`);
    if (cachedEarnings) {
      setEarnings(parseInt(cachedEarnings, 10));
    }

    // Start earning calculation immediately
    const interval = setInterval(() => {
      const baseEarning = 10; // Base earning per minute
      const currentEarnings = baseEarning * user.earningMultiplier;
      
      setEarnings(prev => {
        const newEarnings = prev + currentEarnings;
        // Cache for smooth experience
        localStorage.setItem(`earnings_${user.userId}`, newEarnings.toString());
        return newEarnings;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user.earningMultiplier, user.userId]);

  // ✅ KEPT: VIP purchase functionality (user-initiated action, loading is appropriate)
  const handleVIPPurchase = async () => {
    if (isVipPurchasing) return;
    
    const vipCost = 100;
    
    if (user.stars < vipCost) {
      hapticFeedback('error');
      showTelegramAlert(`Insufficient Stars! You need ${vipCost} stars but only have ${user.stars}.`);
      return;
    }

    if (user.isVIP) {
      hapticFeedback('warning');
      showTelegramAlert('You are already a VIP member!');
      return;
    }

    try {
      setIsVipPurchasing(true);
      hapticFeedback('medium');
      
      const success = await purchaseVIP(user.userId, vipCost);
      
      if (success) {
        const updatedUser: User = {
          ...user,
          stars: user.stars - vipCost,
          isVIP: true,
          earningMultiplier: 2,
          vipExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000),
          lastActive: Date.now()
        };
        
        saveUserToStorage(updatedUser);
        onUserUpdate(updatedUser);
        
        hapticFeedback('success');
        triggerConfetti();
        toast.success('🎉 VIP Activated! Welcome to premium!');
        showTelegramAlert('Congratulations! You are now a VIP member with 2× earning multiplier!');
      }
    } catch (error) {
      console.error('VIP purchase error:', error);
      hapticFeedback('error');
      toast.error('Failed to purchase VIP. Please try again.');
    } finally {
      setIsVipPurchasing(false);
    }
  };

  // ✅ KEPT: VIP status calculations (immediate, no loading)
  const isVipExpired = user.vipExpiry && user.vipExpiry < Date.now();
  const vipTimeLeft = user.vipExpiry ? Math.max(0, user.vipExpiry - Date.now()) : 0;
  const vipDaysLeft = Math.ceil(vipTimeLeft / (24 * 60 * 60 * 1000));

  // ✅ SIMPLIFIED: Immediate render - no loading checks, no conditional rendering based on initialization
  return (
    <div className="min-h-screen bg-gradient-dark p-4 pb-20">
      {/* ✅ KEPT: All UI components render immediately */}
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome, {user.username}! 👋
        </h1>
        <p className="text-gray-400">
          {user.isVIP && !isVipExpired ? 'VIP Member' : 'Free Member'}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Stars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Star className="w-6 h-6 text-yellow-400 mr-2" />
            <span className="text-sm text-gray-400">Stars</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {formatNumber(user.stars)}
          </div>
        </motion.div>

        {/* VIP Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "glass-panel p-4 text-center",
            user.isVIP && !isVipExpired && "neon-glow"
          )}
        >
          <div className="flex items-center justify-center mb-2">
            <Crown className={cn(
              "w-6 h-6 mr-2",
              user.isVIP && !isVipExpired ? "text-yellow-400" : "text-gray-400"
            )} />
            <span className="text-sm text-gray-400">Status</span>
          </div>
          <div className={cn(
            "text-lg font-bold",
            user.isVIP && !isVipExpired ? "text-yellow-400" : "text-gray-400"
          )}>
            {user.isVIP && !isVipExpired ? 'VIP' : 'Free'}
          </div>
          {user.isVIP && !isVipExpired && vipDaysLeft > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {vipDaysLeft} days left
            </div>
          )}
        </motion.div>

        {/* Earning Multiplier */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-6 h-6 text-primary-400 mr-2" />
            <span className="text-sm text-gray-400">Multiplier</span>
          </div>
          <div className="text-2xl font-bold text-primary-400">
            {user.earningMultiplier}×
          </div>
        </motion.div>

        {/* Referrals */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4 text-center"
        >
          <div className="flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-green-400 mr-2" />
            <span className="text-sm text-gray-400">Referrals</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {user.referralCount}
          </div>
        </motion.div>
      </div>

      {/* Live Earnings Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-6 mb-6 text-center"
      >
        <div className="flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6 text-green-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Live Earnings</h3>
        </div>
        <div className="text-3xl font-bold gradient-text mb-2">
          {formatNumber(Math.floor(earnings + user.totalEarnings))}
        </div>
        <div className="text-sm text-gray-400">
          Earning {10 * user.earningMultiplier} coins/minute
        </div>
        {user.isVIP && !isVipExpired && (
          <div className="flex items-center justify-center mt-2 text-yellow-400">
            <Sparkles className="w-4 h-4 mr-1" />
            <span className="text-xs">VIP Boost Active</span>
          </div>
        )}
      </motion.div>

      {/* VIP Purchase Section */}
      {(!user.isVIP || isVipExpired) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-6 mb-6"
        >
          <div className="text-center mb-4">
            <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">
              Upgrade to VIP
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Get 2× earning multiplier and exclusive benefits!
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Earning Multiplier</span>
              <span className="text-primary-400 font-semibold">1× → 2×</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">VIP Duration</span>
              <span className="text-green-400 font-semibold">30 Days</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Cost</span>
              <span className="text-yellow-400 font-semibold">100 ⭐</span>
            </div>
          </div>

          {/* ✅ SIMPLIFIED: Only VIP purchase has loading (user action) */}
          <motion.button
            onClick={handleVIPPurchase}
            disabled={isVipPurchasing || user.stars < 100}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all duration-300",
              "flex items-center justify-center space-x-2",
              user.stars >= 100 
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 neon-glow tap-effect"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
            whileHover={user.stars >= 100 ? { scale: 1.02 } : {}}
            whileTap={user.stars >= 100 ? { scale: 0.98 } : {}}
          >
            <AnimatePresence mode="wait">
              {isVipPurchasing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Activating VIP...</span>
                </motion.div>
              ) : user.stars >= 100 ? (
                <motion.div
                  key="purchase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <Crown className="w-5 h-5" />
                  <span>Become VIP - 100 ⭐</span>
                </motion.div>
              ) : (
                <motion.div
                  key="insufficient"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <Star className="w-5 h-5" />
                  <span>Need {100 - user.stars} more ⭐</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}

      {/* VIP Active Section */}
      {user.isVIP && !isVipExpired && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-6 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30"
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-green-400 mr-2" />
              <h3 className="text-xl font-bold text-white">VIP Active!</h3>
            </div>
            <p className="text-gray-300 mb-4">
              You're earning 2× coins with VIP benefits
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-yellow-400">{vipDaysLeft} days left</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-primary-400 mr-1" />
                <span className="text-primary-400">2× Multiplier</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 gap-4"
      >
        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="w-5 h-5 text-purple-400 mr-2" />
              <span className="text-white">Active Boosts</span>
            </div>
            <span className="text-purple-400 font-semibold">{user.boosts}</span>
          </div>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-white">Total Earnings</span>
            </div>
            <span className="text-green-400 font-semibold">
              {formatNumber(user.totalEarnings)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Bottom Spacer */}
      <div className="h-8" />
    </div>
  );
};

export default SimplifiedUserPanel;

/**
 * 🚀 PRODUCTION INTEGRATION GUIDE:
 * 
 * 1. Replace your existing UserPanel with this component:
 *    import SimplifiedUserPanel from './components/SimplifiedUserPanel';
 * 
 * 2. Use it in your App.tsx:
 *    <SimplifiedUserPanel user={currentUser} onUserUpdate={handleUserUpdate} />
 * 
 * 3. Ensure your Firebase hooks are properly set up for background sync:
 *    const { user: firebaseUser } = useFirebaseUser(userId);
 * 
 * 4. Keep your Telegram WebApp integration as-is in App.tsx:
 *    const telegramData = getTelegramWebAppData();
 *    const telegramUser = telegramData?.user;
 *    const userId = telegramUser?.id.toString() || null;
 * 
 * ✅ BENEFITS:
 * - Immediate rendering when user prop is available
 * - Firebase sync happens automatically in background
 * - No complex loading logic or conditional rendering
 * - All features remain fully functional
 * - Clean, maintainable code
 * - Production-ready performance
 */