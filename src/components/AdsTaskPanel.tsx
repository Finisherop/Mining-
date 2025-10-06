import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Clock, Crown, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { cn, playSound } from '../utils';
import { getTodaysAdsProgress, trackAdsWatching } from '../firebase/taskVerificationHooks';
import toast from 'react-hot-toast';

const AdsTaskPanel: React.FC = () => {
  const { user, setUser } = useAppStore();
  const [adsWatched, setAdsWatched] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [watchTimer, setWatchTimer] = useState(0);
  const [loading, setLoading] = useState(true);

  const dailyLimit = 10; // Free users: 10 ads per day
  const adReward = 5; // 5 coins per ad
  const adDuration = 30; // 30 seconds per ad

  useEffect(() => {
    const loadAdsProgress = async () => {
      if (!user) return;
      
      try {
        const todayProgress = await getTodaysAdsProgress(user.userId);
        setAdsWatched(todayProgress);
      } catch (error) {
        console.error('Error loading ads progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdsProgress();
  }, [user]);

  // Watch ad timer
  useEffect(() => {
    if (isWatching && watchTimer > 0) {
      const interval = setInterval(() => {
        setWatchTimer(prev => {
          if (prev <= 1) {
            handleAdComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isWatching, watchTimer]);

  const canWatchAds = () => {
    if (!user) return false;
    
    // VIP users have unlimited ads
    if (user.tier !== 'free') return true;
    
    // Free users limited to daily limit
    return adsWatched < dailyLimit;
  };

  const handleWatchAd = () => {
    if (!user || !canWatchAds() || isWatching) return;
    
    setIsWatching(true);
    setWatchTimer(adDuration);
    playSound('click');
    
    // Simulate ad watching (in real app, this would show actual ads)
    toast('📺 Ad is playing... Please wait', { icon: '👀' });
  };

  const handleAdComplete = async () => {
    if (!user) return;
    
    setIsWatching(false);
    setWatchTimer(0);
    
    const newAdsCount = adsWatched + 1;
    const earnedCoins = adReward;
    
    try {
      // Update ads progress
      await trackAdsWatching(user.userId, newAdsCount);
      setAdsWatched(newAdsCount);
      
      // Update user coins
      const updatedUser = {
        ...user,
        coins: user.coins + earnedCoins,
        totalEarnings: user.totalEarnings + earnedCoins
      };
      
      setUser(updatedUser);
      
      toast.success(`🎉 Ad completed! +${earnedCoins} coins`);
      playSound('success');
    } catch (error) {
      console.error('Error completing ad:', error);
      toast.error('Failed to complete ad');
    }
  };

  if (!user || loading) {
    return (
      <div className="glass-panel p-6 text-center">
        <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading ads...</p>
      </div>
    );
  }

  const isVip = user.tier !== 'free';
  const remainingAds = isVip ? '∞' : Math.max(0, dailyLimit - adsWatched);
  const progress = isVip ? 100 : Math.min((adsWatched / dailyLimit) * 100, 100);

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Watch Ads</h3>
            <p className="text-sm text-gray-400">
              Earn {adReward} coins per ad • {adDuration}s each
            </p>
          </div>
        </div>
        
        {isVip && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4" />
            <span>Unlimited</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Today's Progress</span>
          <span className="text-white font-bold">
            {adsWatched} / {isVip ? '∞' : dailyLimit}
          </span>
        </div>
        
        {!isVip && (
          <div className="w-full bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{adsWatched}</div>
          <div className="text-xs text-gray-400">Watched Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{adsWatched * adReward}</div>
          <div className="text-xs text-gray-400">Coins Earned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{remainingAds}</div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
      </div>

      {/* Watch Ad Button */}
      <div className="space-y-4">
        {isWatching ? (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">📺</div>
            <h4 className="text-lg font-bold text-white mb-2">Watching Ad...</h4>
            <div className="flex items-center justify-center space-x-2 text-purple-400 mb-4">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-bold">{watchTimer}s</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${(watchTimer / adDuration) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">Please wait while the ad plays...</p>
          </div>
        ) : (
          <motion.button
            onClick={handleWatchAd}
            disabled={!canWatchAds()}
            className={cn(
              "w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3",
              canWatchAds()
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 neon-glow"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
            whileHover={canWatchAds() ? { scale: 1.02 } : {}}
            whileTap={canWatchAds() ? { scale: 0.98 } : {}}
          >
            <Play className="w-6 h-6" />
            <span>
              {canWatchAds() ? `Watch Ad (+${adReward} coins)` : 'Daily Limit Reached'}
            </span>
          </motion.button>
        )}

        {/* VIP Upgrade Prompt for Free Users */}
        {!isVip && adsWatched >= dailyLimit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 text-center"
          >
            <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <h5 className="font-bold text-white mb-1">Upgrade to VIP</h5>
            <p className="text-sm text-gray-400 mb-3">
              Get unlimited ad watching and earn more coins!
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Unlimited Ads</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>Higher Rewards</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdsTaskPanel;