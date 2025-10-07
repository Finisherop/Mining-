import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, TrendingUp, Zap, Clock, Crown, Sparkles, Star, Timer } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, formatNumber, triggerCoinBurst, playSound, calculateFarmingEarnings } from '../utils';
import { useSmoothCounter, useThrottle } from '../hooks/useSmoothCounter';
import { useOptimizedAnimations, useNetworkOptimization } from '../hooks/usePerformanceMonitor';

const FarmingDashboard: React.FC = () => {
  const {
    user,
    farmingSession,
    startFarming,
    stopFarming,
    updateFarmingEarnings
  } = useAppStore();

  // Smooth counter for total coins to prevent flashing
  const smoothTotalCoins = useSmoothCounter(user?.coins || 0, {
    duration: 600,
    precision: 0
  });

  // Smooth counter for session earnings
  const smoothSessionEarnings = useSmoothCounter(
    farmingSession?.active ? farmingSession.totalEarned : 0,
    { duration: 400, precision: 0 }
  );

  // Memoized calculations to prevent unnecessary re-renders
  const farmingStats = useMemo(() => {
    if (!farmingSession?.active) {
      return {
        sessionDuration: 0,
        sessionSeconds: 0,
        currentEarnings: 0,
        isActive: false
      };
    }

    const now = Date.now();
    const sessionSeconds = Math.floor((now - farmingSession.startTime) / 1000);
    const sessionDuration = Math.floor(sessionSeconds / 60);
    
    return {
      sessionDuration,
      sessionSeconds,
      currentEarnings: farmingSession.totalEarned,
      isActive: true
    };
  }, [farmingSession?.active, farmingSession?.startTime, farmingSession?.totalEarned]);

  // Performance optimizations
  const animationConfig = useOptimizedAnimations();
  const { recommendedUpdateInterval } = useNetworkOptimization();
  
  // Throttled update function with adaptive interval based on network
  const throttledUpdateEarnings = useThrottle(updateFarmingEarnings, recommendedUpdateInterval);

  // Optimized farming update effect
  useEffect(() => {
    if (!farmingStats.isActive || !user) return;

    const interval = setInterval(() => {
      // Use throttled update to prevent excessive calls
      throttledUpdateEarnings();
    }, 1000);

    return () => clearInterval(interval);
  }, [farmingStats.isActive, user, throttledUpdateEarnings]);

  // Memoized user stats to prevent recalculation
  const userStats = useMemo(() => {
    if (!user) return null;
    
    const tierConfig = TIER_CONFIGS[user.vip_tier];
    const isVip = user.vip_tier !== 'free' && user.vip_expiry && user.vip_expiry > Date.now();
    const farmingRate = user.farmingRate * (user.multiplier || 1);
    const vipTimeLeft = user.vip_expiry ? Math.max(0, user.vip_expiry - Date.now()) : 0;
    
    return {
      tierConfig,
      isVip,
      farmingRate,
      vipTimeLeft,
      vipHoursLeft: Math.ceil(vipTimeLeft / (60 * 60 * 1000)),
      vipDaysLeft: Math.ceil(vipTimeLeft / (24 * 60 * 60 * 1000))
    };
  }, [user?.vip_tier, user?.vip_expiry, user?.farmingRate, user?.multiplier]);

  const handleFarmingToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (farmingStats.isActive) {
      stopFarming();
      playSound('success');
    } else {
      startFarming();
      playSound('click');
      triggerCoinBurst(event.currentTarget);
    }
  }, [farmingStats.isActive, stopFarming, startFarming]);

  // Early return with loading state
  if (!user || !userStats) {
    return (
      <div className="glass-panel p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel p-4">
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { tierConfig, isVip, farmingRate, vipDaysLeft, vipHoursLeft } = userStats;

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Live Farming Counter</h2>
            <p className="text-gray-400 text-sm">
              {isVip ? `VIP active — ${user.multiplier}× farming speed` : 'Start farming to earn coins'}
            </p>
          </div>
        </div>
        
        {/* VIP Status & Timer */}
        {isVip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-right"
          >
            <div className="flex items-center space-x-2 mb-1">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-5 h-5 text-yellow-400" />
              </motion.div>
              <span className="text-yellow-400 font-bold">{tierConfig.name}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Timer className="w-3 h-3" />
              <span>VIP • {vipDaysLeft > 1 ? `${vipDaysLeft}d` : `${vipHoursLeft}h`} left</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Coins - Smooth Animation */}
        <motion.div
          className="glass-panel p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <motion.div 
              className="coin-icon mr-2"
              animate={smoothTotalCoins.isAnimating && animationConfig.enableComplexAnimations ? {
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ duration: animationConfig.duration }}
            />
            <span className="text-sm text-gray-400">Total Coins</span>
          </div>
          <motion.div
            className="text-2xl font-bold"
            animate={smoothTotalCoins.isAnimating && animationConfig.enableComplexAnimations ? {
              color: ['#ffffff', '#22c5f0', '#ffffff']
            } : {}}
            transition={{ duration: animationConfig.duration }}
          >
            {formatNumber(Math.floor(smoothTotalCoins.value))}
          </motion.div>
        </motion.div>

        {/* Farming Rate */}
        <motion.div
          className="glass-panel p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
            <span className="text-sm text-gray-400">Rate/Min</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {farmingRate}
          </div>
          {isVip && (
            <div className="text-xs text-yellow-400 mt-1 flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>{user.multiplier}× VIP Boost</span>
            </div>
          )}
        </motion.div>

        {/* Current Session - Smooth Animation */}
        <motion.div
          className="glass-panel p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <Zap className="w-4 h-4 mr-2 text-primary-400" />
            <span className="text-sm text-gray-400">Session</span>
          </div>
          <motion.div
            className="text-2xl font-bold"
            animate={smoothSessionEarnings.isAnimating ? {
              scale: [1, 1.05, 1],
              color: ['#ffffff', '#22c5f0', '#ffffff']
            } : {}}
            transition={{ duration: 0.4 }}
          >
            {formatNumber(Math.floor(smoothSessionEarnings.value))}
          </motion.div>
        </motion.div>

        {/* Status */}
        <motion.div
          className="glass-panel p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-400">Status</span>
          </div>
          <div className={cn(
            "text-sm font-medium",
            farmingStats.isActive ? "text-green-400" : "text-gray-400"
          )}>
            {farmingStats.isActive ? "Active" : "Idle"}
          </div>
          {farmingStats.isActive && (
            <div className="flex items-center justify-center mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1" />
              <span className="text-xs text-green-400">Farming...</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Farming Control */}
      <div className="flex flex-col items-center space-y-4">
        <motion.button
          onClick={handleFarmingToggle}
          className={cn(
            "relative w-32 h-32 rounded-full flex items-center justify-center",
            "text-white font-bold text-lg transition-all duration-300",
            "tap-effect hover-lift",
            farmingStats.isActive
              ? "bg-gradient-to-r from-red-500 to-red-600 neon-glow"
              : "bg-gradient-to-r from-green-500 to-green-600 neon-glow"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={farmingStats.isActive ? { 
            boxShadow: [
              '0 0 20px rgba(34, 197, 240, 0.3)',
              '0 0 40px rgba(34, 197, 240, 0.6)',
              '0 0 20px rgba(34, 197, 240, 0.3)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AnimatePresence mode="wait">
            {farmingStats.isActive ? (
              <motion.div
                key="pause"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="flex flex-col items-center"
              >
                <Pause className="w-8 h-8 mb-1" />
                <span className="text-sm">Stop</span>
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                className="flex flex-col items-center"
              >
                <Play className="w-8 h-8 mb-1 ml-1" />
                <span className="text-sm">Farm</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Ripple Effect */}
          {farmingStats.isActive && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>

        {/* Farming Tips */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400">
            {farmingStats.isActive
              ? "Farming in progress... Keep the app open for best results!"
              : "Click to start farming coins automatically"
            }
          </p>
          
          {isVip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center space-x-2 text-xs"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-yellow-400 rounded-full"
              />
              <span className="text-yellow-400 font-medium">
                VIP Boost Active: {user.multiplier}× Speed
              </span>
              <Crown className="w-3 h-3 text-yellow-400" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Active Perks Display */}
      {isVip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-lg font-bold text-yellow-400">Active Perks</span>
            </div>
            <div className="text-xs text-gray-400">
              Expires in {vipDaysLeft > 1 ? `${vipDaysLeft} days` : `${vipHoursLeft} hours`}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary-400" />
              <span className="text-sm text-white">{user.multiplier}× Farming Speed</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white">{user.withdraw_limit} Withdrawals/day</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white">{user.referral_boost}× Referral Bonus</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white">{tierConfig.badge} Badge</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Bar - OPTIMIZED WITH SMOOTH DATA */}
      {farmingStats.isActive && farmingSession && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="space-y-3"
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Session Progress</span>
            <div className="flex items-center space-x-4">
              <span className="text-primary-400">
                {formatNumber(Math.floor(smoothSessionEarnings.value))} coins earned
              </span>
              <span className="text-green-400">
                {Math.floor(farmingStats.sessionSeconds / 60)}m {farmingStats.sessionSeconds % 60}s active
              </span>
              <span className="text-yellow-400">
                {farmingSession.baseRate * farmingSession.multiplier} coins/min
              </span>
            </div>
          </div>
          
          {/* Real-time Progress Bar */}
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-green-500"
              initial={{ width: '0%' }}
              animate={{ 
                width: `${Math.min((farmingStats.sessionDuration / 60) * 100, 100)}%`, // Progress based on 1-hour cycle
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ 
                width: { duration: 1, ease: "easeOut" },
                backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
              }}
              style={{
                backgroundSize: '200% 100%'
              }}
            />
          </div>
          
          {/* Session Stats - OPTIMIZED WITH SMOOTH DATA */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-white font-semibold">
                {Math.floor(farmingStats.sessionDuration / 60)}h {farmingStats.sessionDuration % 60}m
              </div>
              <div className="text-gray-400">Session Time</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-semibold">
                +{farmingSession.baseRate * farmingSession.multiplier}/min
              </div>
              <div className="text-gray-400">Earning Rate</div>
            </div>
            <div className="text-center">
              <div className="text-primary-400 font-semibold">
                {formatNumber(Math.floor(smoothSessionEarnings.value))}
              </div>
              <div className="text-gray-400">Session Total</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Streak Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🔥</div>
            <div>
              <div className="text-lg font-bold text-white">{user.claimStreak} Day Streak</div>
              <div className="text-sm text-gray-400">Keep claiming daily rewards!</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-400 font-medium">Next Reward</div>
            <div className="text-xs text-gray-400">
              {user.claimedDays.length < 7 ? `Day ${user.claimedDays.length + 1}` : 'All claimed!'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FarmingDashboard;