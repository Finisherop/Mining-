import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, TrendingUp, Users, CreditCard, Clock, Gift, Zap } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, formatTimeRemaining, isVipActive, getVipTimeRemaining } from '../utils';

const VipPanel: React.FC = () => {
  const { user } = useAppStore();

  if (!user) return null;

  const tierConfig = TIER_CONFIGS[user.tier];
  const isVip = user.tier !== 'free';
  const vipActive = isVipActive(user.vipExpiry);
  const timeRemaining = getVipTimeRemaining(user.vipExpiry);

  const benefits = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Farming Speed',
      description: `${tierConfig.farmingMultiplier}× faster coin generation`,
      value: `${tierConfig.farmingMultiplier}×`,
      color: 'text-green-400'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: 'Daily Withdrawals',
      description: `Up to ${tierConfig.dailyWithdrawals} withdrawals per day`,
      value: tierConfig.dailyWithdrawals.toString(),
      color: 'text-blue-400'
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: 'Minimum Withdrawal',
      description: `Lower minimum of ₹${tierConfig.minWithdrawal}`,
      value: `₹${tierConfig.minWithdrawal}`,
      color: 'text-purple-400'
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: 'Referral Bonus',
      description: `${tierConfig.referralMultiplier}× referral rewards`,
      value: `${tierConfig.referralMultiplier}×`,
      color: 'text-yellow-400'
    }
  ];

  const tierComparison = [
    { tier: 'free', name: 'Free', current: user.tier === 'free' },
    { tier: 'bronze', name: 'Bronze VIP', current: user.tier === 'bronze' },
    { tier: 'diamond', name: 'Diamond VIP', current: user.tier === 'diamond' }
  ];

  return (
    <div className="glass-panel p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">VIP Services</h3>
            <p className="text-sm text-gray-400">Quick VIP overview, perks, multiplier info</p>
          </div>
        </div>
        
        {/* Current Tier Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "px-4 py-2 rounded-lg font-bold text-sm flex items-center space-x-2",
            isVip 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white vip-badge"
              : "bg-gray-700 text-gray-300"
          )}
        >
          <Crown className="w-4 h-4" />
          <span>{tierConfig.name}</span>
        </motion.div>
      </div>

      {/* VIP Status */}
      {isVip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl p-4 border-2",
            vipActive 
              ? "bg-green-500/10 border-green-500/40"
              : "bg-red-500/10 border-red-500/40"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                vipActive ? "bg-green-400 animate-pulse" : "bg-red-400"
              )} />
              <div>
                <div className={cn(
                  "font-semibold",
                  vipActive ? "text-green-400" : "text-red-400"
                )}>
                  VIP Status: {vipActive ? 'Active' : 'Expired'}
                </div>
                {vipActive && timeRemaining && (
                  <div className="text-sm text-gray-400">
                    {timeRemaining} remaining
                  </div>
                )}
              </div>
            </div>
            
            {vipActive && (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl"
              >
                👑
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Current Benefits */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-primary-400" />
          Your Benefits
        </h4>
        
        <div className="grid gap-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/10"
            >
              <div className="flex items-center space-x-3">
                <div className={cn("p-2 rounded-lg", benefit.color.replace('text-', 'bg-').replace('-400', '-500/20'))}>
                  {benefit.icon}
                </div>
                <div>
                  <div className="font-medium text-white">{benefit.title}</div>
                  <div className="text-sm text-gray-400">{benefit.description}</div>
                </div>
              </div>
              
              <div className={cn("text-xl font-bold", benefit.color)}>
                {benefit.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tier Comparison */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400" />
          Tier Comparison
        </h4>
        
        <div className="space-y-3">
          {tierComparison.map((tier) => {
            const config = TIER_CONFIGS[tier.tier as keyof typeof TIER_CONFIGS];
            const isCurrent = tier.current;
            
            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-300",
                  isCurrent
                    ? "bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-primary-500/40 neon-glow"
                    : "bg-gray-800/50 border-gray-700/40"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "text-2xl p-2 rounded-lg",
                      isCurrent ? "bg-gradient-to-r from-primary-500/20 to-secondary-500/20" : "bg-gray-700/50"
                    )}>
                      {tier.tier === 'free' ? '🥉' : tier.tier === 'bronze' ? '🥉' : '💎'}
                    </div>
                    <div>
                      <div className={cn(
                        "font-semibold",
                        isCurrent ? "text-white" : "text-gray-300"
                      )}>
                        {config.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {config.starCost === 0 ? 'Free' : `${config.starCost} stars`}
                      </div>
                    </div>
                  </div>
                  
                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium"
                    >
                      Current
                    </motion.div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span className="text-gray-300">{config.farmingMultiplier}× farming</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-3 h-3 text-blue-400" />
                    <span className="text-gray-300">{config.dailyWithdrawals}/day</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gift className="w-3 h-3 text-purple-400" />
                    <span className="text-gray-300">₹{config.minWithdrawal} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-300">{config.referralMultiplier}× referral</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Upgrade CTA */}
      {!isVip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/40 rounded-lg p-6 text-center"
        >
          <div className="text-4xl mb-3">🚀</div>
          <h5 className="text-lg font-bold text-white mb-2">Upgrade to VIP</h5>
          <p className="text-sm text-gray-400 mb-4">
            Unlock premium benefits and boost your earnings!
          </p>
          <motion.button
            onClick={() => {/* Navigate to shop */}}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 tap-effect neon-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View Shop
          </motion.button>
        </motion.div>
      )}

      {/* VIP Perks Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4"
      >
        <h5 className="font-semibold text-purple-400 mb-2">✨ VIP Exclusive</h5>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Priority customer support</li>
          <li>• Exclusive access to special events</li>
          <li>• Advanced farming statistics</li>
          <li>• Custom profile badges</li>
          <li>• Early access to new features</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default VipPanel;