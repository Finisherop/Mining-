import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, Crown, Zap, Clock, Check, Loader2 } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, triggerConfetti, triggerStarBurst, playSound } from '../utils';
import { purchaseVIPTier, showPaymentAlert, showPaymentConfirm, paymentHaptic } from '../utils/telegramPayments';
import toast from 'react-hot-toast';

const ShopPanel: React.FC = () => {
  const { user, shopItems, purchaseItem, isLoading, setUser } = useAppStore();
  const [purchasingItem, setPurchasingItem] = useState<string | null>(null);
  const [purchaseProgress, setPurchaseProgress] = useState<string>('');

  const handleVIPPurchase = async (tier: 'bronze' | 'diamond', starCost: number) => {
    if (!user || purchasingItem) return;

    const tierConfig = TIER_CONFIGS[tier];
    
    showPaymentConfirm(
      `Purchase ${tierConfig.name} for ${starCost} ⭐?\n\nFeatures:\n${tierConfig.features.join('\n')}`,
      async () => {
        setPurchasingItem(tier);
        setPurchaseProgress('Preparing payment...');
        paymentHaptic('medium');

        try {
          await purchaseVIPTier(
            user.id,
            tier,
            starCost,
            // Success callback
            (purchasedTier) => {
              const vipExpiry = Date.now() + (tierConfig.duration * 24 * 60 * 60 * 1000);
              
              const updatedUser = {
                ...user,
                vip_tier: purchasedTier,
                vip_expiry: vipExpiry,
                multiplier: tierConfig.farmingMultiplier,
                withdraw_limit: tierConfig.dailyWithdrawals,
                referral_boost: tierConfig.referralMultiplier,
                tier: purchasedTier, // Update legacy tier field too
                badges: [
                  ...user.badges,
                  {
                    type: tierConfig.badge,
                    name: `${tierConfig.name} Member`,
                    description: `Upgraded to ${tierConfig.name}`,
                    icon: tier === 'bronze' ? '🥉' : '💎',
                    color: tierConfig.color,
                    unlockedAt: Date.now()
                  }
                ]
              };

              setUser(updatedUser);
              
              // Celebration effects
              setTimeout(() => {
                triggerConfetti({ x: 0.5, y: 0.3 });
                playSound('success');
                paymentHaptic('heavy');
              }, 500);

              toast.success('🎉 VIP Activated! Welcome to premium!', { duration: 5000 });
              showPaymentAlert(`Congratulations! You are now a ${tierConfig.name} member!`, 'success');
            },
            // Error callback
            (error) => {
              console.error('VIP purchase failed:', error);
              toast.error(`Purchase failed: ${error}`);
              showPaymentAlert(`Purchase failed: ${error}`, 'error');
              paymentHaptic('heavy');
            },
            // Progress callback
            (stage) => {
              setPurchaseProgress(stage);
            }
          );
        } catch (error) {
          console.error('Purchase error:', error);
          toast.error('Purchase failed. Please try again.');
          paymentHaptic('heavy');
        } finally {
          setPurchasingItem(null);
          setPurchaseProgress('');
        }
      },
      () => {
        // Cancel callback
        paymentHaptic('light');
      }
    );
  };

  const handleBoostPurchase = async (itemId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user || purchasingItem || isLoading) return;
    
    const item = shopItems.find(i => i.id === itemId);
    if (!item || user.stars < item.starCost) return;

    setPurchasingItem(itemId);
    playSound('click');
    
    // Visual feedback
    triggerStarBurst(event.currentTarget);

    try {
      await purchaseItem(itemId);
      playSound('success');
    } catch (error) {
      playSound('error');
    } finally {
      setPurchasingItem(null);
    }
  };

  if (!user) return null;

  const tierUpgrades = shopItems.filter(item => item.type === 'tier_upgrade');
  const boosts = shopItems.filter(item => item.type === 'boost');

  return (
    <div className="glass-panel p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Premium Shop</h3>
            <p className="text-sm text-gray-400">Tap to unlock VIP perks & boost farming!</p>
          </div>
        </div>
        
        {/* Stars Balance */}
        <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-lg border border-yellow-500/30">
          <Star className="w-5 h-5 text-yellow-400" />
          <span className="text-lg font-bold text-yellow-400">{user.stars}</span>
        </div>
      </div>

      {/* Tier Upgrades */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Crown className="w-5 h-5 mr-2 text-yellow-400" />
          VIP Tier Upgrades
        </h4>
        
        <div className="grid gap-4">
          {tierUpgrades.map((item) => {
            const tier = item.id.includes('bronze') ? 'bronze' : 'diamond';
            const tierConfig = TIER_CONFIGS[tier];
            const isOwned = user.vip_tier === tier || (tier === 'bronze' && user.vip_tier === 'diamond');
            const isExpired = user.vip_expiry && user.vip_expiry < Date.now();
            const canPurchase = !isOwned || isExpired;
            const isPurchasing = purchasingItem === tier;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative overflow-hidden rounded-xl border-2 transition-all duration-300",
                  isOwned && !isExpired
                    ? "bg-green-500/10 border-green-500/40"
                    : canPurchase
                    ? "bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/40 hover:border-primary-500/60"
                    : "bg-gray-800/50 border-gray-700/40"
                )}
                whileHover={canPurchase ? { scale: 1.02 } : {}}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent transform rotate-45" />
                </div>
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "text-3xl p-3 rounded-xl",
                        `bg-gradient-to-r from-${tierConfig.color}/20 to-${tierConfig.color}/10`
                      )}>
                        {item.icon}
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-white">{item.name}</h5>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                    </div>
                    
                    {isOwned && !isExpired && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-green-500 text-white p-2 rounded-full"
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                    )}
                    
                    {isExpired && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-orange-500 text-white p-2 rounded-full"
                      >
                        <Clock className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {tierConfig.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-400 rounded-full" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Purchase Button */}
                  <motion.button
                    onClick={() => handleVIPPurchase(tier, item.starCost)}
                    disabled={!canPurchase || isPurchasing}
                    className={cn(
                      "w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300",
                      "flex items-center justify-center space-x-2",
                      isOwned && !isExpired
                        ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                        : canPurchase
                        ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 tap-effect neon-glow"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                    whileHover={canPurchase ? { scale: 1.02 } : {}}
                    whileTap={canPurchase ? { scale: 0.98 } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {isPurchasing ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </div>
                          {purchaseProgress && (
                            <span className="text-xs text-gray-300">{purchaseProgress}</span>
                          )}
                        </motion.div>
                      ) : isOwned && !isExpired ? (
                        <motion.div
                          key="owned"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Active</span>
                        </motion.div>
                      ) : isExpired ? (
                        <motion.div
                          key="expired"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center space-x-2"
                        >
                          <Crown className="w-4 h-4" />
                          <span>Renew - {item.starCost} ⭐</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="purchase"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center space-x-2"
                        >
                          <Star className="w-4 h-4" />
                          <span>{item.starCost} Stars</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
                
                {/* Glow Effect for Purchasable Items */}
                {canPurchase && (
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-20"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(34, 197, 240, 0.3)',
                        '0 0 40px rgba(236, 88, 255, 0.4)',
                        '0 0 20px rgba(34, 197, 240, 0.3)'
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
                
                {/* VIP Active Glow */}
                {isOwned && !isExpired && (
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-20"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(34, 197, 94, 0.3)',
                        '0 0 25px rgba(34, 197, 94, 0.5)',
                        '0 0 15px rgba(34, 197, 94, 0.3)'
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Boosts */}
      {boosts.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Temporary Boosts
          </h4>
          
          <div className="grid gap-3">
            {boosts.map((item) => {
              const canAfford = user.stars >= item.starCost;
              const isPurchasing = purchasingItem === item.id;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all duration-300",
                    canAfford
                      ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/40 hover:border-yellow-500/60"
                      : "bg-gray-800/50 border-gray-700/40"
                  )}
                  whileHover={canAfford ? { scale: 1.02 } : {}}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <h6 className="font-semibold text-white">{item.name}</h6>
                      <p className="text-sm text-gray-400">{item.description}</p>
                      {item.duration && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{item.duration}h duration</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={(e) => handleBoostPurchase(item.id, e)}
                    disabled={!canAfford || isPurchasing}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium transition-all duration-300",
                      "flex items-center space-x-2",
                      canAfford
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 tap-effect"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                    whileHover={canAfford ? { scale: 1.05 } : {}}
                    whileTap={canAfford ? { scale: 0.95 } : {}}
                  >
                    {isPurchasing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        <span>{item.starCost}</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4"
      >
        <h5 className="font-semibold text-blue-400 mb-2">⭐ Telegram Stars Payment</h5>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Secure payment via Telegram Stars (openInvoice)</li>
          <li>• VIP benefits activate instantly after payment</li>
          <li>• Lock Buy buttons during unlock to avoid double spending (5s)</li>
          <li>• Animated VIP unlock + confetti + toast notification</li>
          <li>• Auto-update Firebase user record with VIP details</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default ShopPanel;