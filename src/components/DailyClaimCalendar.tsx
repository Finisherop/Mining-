import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Gift, Star, Check, Lock } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, formatNumber, triggerCoinBurst, triggerStarBurst, playSound } from '../utils';

const DailyClaimCalendar: React.FC = () => {
  const { user, dailyRewards, claimDailyReward } = useAppStore();
  const [claimingDay, setClaimingDay] = useState<number | null>(null);

  const handleClaim = async (day: number, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user || claimingDay) return;
    
    const reward = dailyRewards.find(r => r.day === day);
    if (!reward || reward.claimed) return;

    setClaimingDay(day);
    playSound('success');
    
    // Trigger visual effects
    triggerCoinBurst(event.currentTarget);
    if (reward.stars) {
      setTimeout(() => triggerStarBurst(event.currentTarget), 300);
    }

    // Simulate claim delay
    setTimeout(() => {
      claimDailyReward(day);
      setClaimingDay(null);
    }, 1500);
  };

  if (!user) return null;

  const tierConfig = TIER_CONFIGS[user.tier];
  const isVip = user.tier !== 'free';
  const nextClaimableDay = dailyRewards.find(r => !r.claimed)?.day || null;

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Daily Rewards</h3>
            <p className="text-sm text-gray-400">
              Claim daily coins & {isVip ? 'VIP bonus!' : 'upgrade for bonus!'}
            </p>
          </div>
        </div>
        
        {/* Streak Counter */}
        <div className="text-center">
          <div className="text-2xl font-bold gradient-text">{user.claimStreak}</div>
          <div className="text-xs text-gray-400">Day Streak</div>
        </div>
      </div>

      {/* VIP Bonus Info */}
      {isVip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400 font-medium">
              VIP Bonus Active: +{Math.round((tierConfig.farmingMultiplier - 1) * 100)}% extra coins!
            </span>
          </div>
        </motion.div>
      )}

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {dailyRewards.map((reward, index) => {
          const isClaimed = reward.claimed;
          const isClaimable = reward.day === nextClaimableDay;
          const isClaiming = claimingDay === reward.day;
          const isLocked = !isClaimed && !isClaimable;
          
          // Calculate VIP bonus
          const vipBonus = isVip ? Math.floor(reward.coins * (tierConfig.farmingMultiplier - 1)) : 0;
          const totalCoins = reward.coins + vipBonus;

          return (
            <motion.div
              key={reward.day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative"
            >
              <motion.button
                onClick={(e) => handleClaim(reward.day, e)}
                disabled={!isClaimable || isClaiming}
                className={cn(
                  "w-full aspect-square rounded-xl p-3 transition-all duration-300",
                  "flex flex-col items-center justify-center space-y-1",
                  "tap-effect relative overflow-hidden",
                  isClaimed && "bg-green-500/20 border-2 border-green-500/40",
                  isClaimable && "bg-gradient-to-br from-primary-500/20 to-secondary-500/20 border-2 border-primary-500/40 hover-lift neon-glow cursor-pointer",
                  isLocked && "bg-gray-800/50 border-2 border-gray-700/40 cursor-not-allowed opacity-60",
                  isClaiming && "animate-pulse"
                )}
                whileHover={isClaimable ? { scale: 1.05 } : {}}
                whileTap={isClaimable ? { scale: 0.95 } : {}}
              >
                {/* Background Animation for Claimable */}
                {isClaimable && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-xl"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Day Number */}
                <div className={cn(
                  "text-xs font-medium mb-1",
                  isClaimed && "text-green-400",
                  isClaimable && "text-primary-400",
                  isLocked && "text-gray-500"
                )}>
                  Day {reward.day}
                </div>

                {/* Status Icon */}
                <div className="mb-1">
                  <AnimatePresence mode="wait">
                    {isClaiming ? (
                      <motion.div
                        key="claiming"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"
                      />
                    ) : isClaimed ? (
                      <motion.div
                        key="claimed"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : isClaimable ? (
                      <motion.div
                        key="claimable"
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center"
                      >
                        <Gift className="w-4 h-4 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="locked"
                        className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center"
                      >
                        <Lock className="w-3 h-3 text-gray-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reward Amount */}
                <div className="text-center">
                  <div className={cn(
                    "text-sm font-bold",
                    isClaimed && "text-green-400",
                    isClaimable && "text-white",
                    isLocked && "text-gray-500"
                  )}>
                    {formatNumber(totalCoins)}
                  </div>
                  
                  {/* VIP Bonus Indicator */}
                  {vipBonus > 0 && (
                    <div className="text-xs text-yellow-400">
                      +{formatNumber(vipBonus)}
                    </div>
                  )}
                  
                  {/* Stars */}
                  {reward.stars && (
                    <div className="flex items-center justify-center mt-1">
                      <Star className="w-3 h-3 text-yellow-400 mr-1" />
                      <span className="text-xs text-yellow-400">{reward.stars}</span>
                    </div>
                  )}
                </div>

                {/* Special Day 7 Glow */}
                {reward.day === 7 && !isClaimed && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    animate={{
                      boxShadow: [
                        '0 0 0 rgba(255, 215, 0, 0)',
                        '0 0 20px rgba(255, 215, 0, 0.5)',
                        '0 0 0 rgba(255, 215, 0, 0)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Claim Animation Overlay */}
              <AnimatePresence>
                {isClaiming && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-2xl"
                    >
                      🎁
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Next Reward Preview */}
      {nextClaimableDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">Next Reward Available</div>
              <div className="text-lg font-bold text-white">
                Day {nextClaimableDay} - {formatNumber(
                  dailyRewards.find(r => r.day === nextClaimableDay)!.coins +
                  (isVip ? Math.floor(dailyRewards.find(r => r.day === nextClaimableDay)!.coins * (tierConfig.farmingMultiplier - 1)) : 0)
                )} coins
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl"
            >
              🎁
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* All Claimed Message */}
      {!nextClaimableDay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="text-4xl mb-2">🎉</div>
          <div className="text-lg font-bold text-green-400 mb-1">All rewards claimed!</div>
          <div className="text-sm text-gray-400">Check back tomorrow for new rewards</div>
        </motion.div>
      )}
    </div>
  );
};

export default DailyClaimCalendar;