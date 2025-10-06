import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Zap } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { playSound, triggerConfetti } from '../utils';
import VipUpgradeModal from './VipUpgradeModal';

const VipUpgradeButton: React.FC = () => {
  const { user } = useAppStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'diamond'>('bronze');

  if (!user || user.tier !== 'free') return null;

  const handleUpgradeClick = (tier: 'bronze' | 'diamond') => {
    setSelectedTier(tier);
    setShowUpgradeModal(true);
    playSound('click');
    triggerConfetti({ x: 0.5, y: 0.3 });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-20 left-4 right-4 z-40"
      >
        <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/40 rounded-2xl p-4 backdrop-blur-sm">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="text-lg font-bold text-white mb-1">Upgrade to VIP</h3>
            <p className="text-sm text-gray-400">Unlock premium features and boost your earnings!</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Bronze VIP */}
            <motion.button
              onClick={() => handleUpgradeClick('bronze')}
              className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-xl p-3 text-center hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-2xl mb-1">🥉</div>
              <div className="font-bold text-yellow-400 text-sm">Bronze VIP</div>
              <div className="text-xs text-gray-400 mb-2">
                {TIER_CONFIGS.bronze.farmingMultiplier}× Speed • {TIER_CONFIGS.bronze.dailyWithdrawals} Withdrawals
              </div>
              <div className="flex items-center justify-center space-x-1 text-yellow-400">
                <Star className="w-3 h-3" />
                <span className="text-xs font-bold">{TIER_CONFIGS.bronze.starCost}</span>
              </div>
            </motion.button>

            {/* Diamond VIP */}
            <motion.button
              onClick={() => handleUpgradeClick('diamond')}
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 rounded-xl p-3 text-center hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-2xl mb-1">💎</div>
              <div className="font-bold text-blue-400 text-sm">Diamond VIP</div>
              <div className="text-xs text-gray-400 mb-2">
                {TIER_CONFIGS.diamond.farmingMultiplier}× Speed • {TIER_CONFIGS.diamond.dailyWithdrawals} Withdrawals
              </div>
              <div className="flex items-center justify-center space-x-1 text-blue-400">
                <Star className="w-3 h-3" />
                <span className="text-xs font-bold">{TIER_CONFIGS.diamond.starCost}</span>
              </div>
            </motion.button>
          </div>

          {/* Features Preview */}
          <div className="mt-3 text-center">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Faster Farming</span>
              </div>
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>VIP Badges</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>More Rewards</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <VipUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tier={selectedTier}
      />
    </>
  );
};

export default VipUpgradeButton;