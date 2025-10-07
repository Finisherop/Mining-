import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Share2, Gift, TrendingUp, Crown, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { useUserReferrals, generateReferralLink, getReferralStats } from '../firebase/referralHooks';
import { cn, formatNumber, copyToClipboard, playSound } from '../utils';
import toast from 'react-hot-toast';

const ReferralPanel: React.FC = () => {
  const { user } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0
  });

  // FIX: Use Firebase data instead of dummy data
  const { referrals, loading: referralsLoading, error } = useUserReferrals(user?.userId || null);

  // Generate HTTPS referral link on component mount
  useEffect(() => {
    if (user) {
      const httpsLink = generateReferralLink(user.userId, user.username);
      setReferralLink(httpsLink);
    }
  }, [user]);

  // Load referral statistics from Firebase
  useEffect(() => {
    const loadStats = async () => {
      if (user?.userId) {
        const referralStats = await getReferralStats(user.userId);
        setStats(referralStats);
      }
    };

    loadStats();
  }, [user?.userId, referrals]);

  const handleCopyReferralCode = async () => {
    if (!referralLink) return;
    
    const success = await copyToClipboard(referralLink);
    if (success) {
      setCopied(true);
      playSound('success');
      toast.success('🔗 Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (!referralLink) return;
    
    const shareText = `🚀 Join me on Mining Tech Bot and start earning coins!\n\n💰 Tap this link to get started:\n${referralLink}\n\n🎁 You'll get bonus coins when you join!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Mining Tech Bot',
        text: shareText,
        url: referralLink
      });
    } else {
      copyToClipboard(shareText);
      toast.success('📋 Share message copied!');
    }
    
    playSound('click');
  };

  if (!user) return null;

  const tierConfig = TIER_CONFIGS[user.tier];
  // FIX: Use Firebase stats instead of dummy calculation
  const totalEarnings = stats.totalEarnings;
  const bonusEarnings = Math.floor(totalEarnings * (tierConfig.referralMultiplier - 1));

  // Show loading state
  if (referralsLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-panel p-6 text-center">
          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
          <p className="text-white">Loading referral data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-red-400">Error loading referrals: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Referral Program</h2>
          <p className="text-gray-400">Invite friends and earn rewards together</p>
        </div>
        
        {/* VIP Multiplier Badge */}
        {user.tier !== 'free' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1"
          >
            <Crown className="w-4 h-4" />
            <span>{tierConfig.referralMultiplier}× VIP Bonus</span>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 text-center"
        >
          <Users className="w-6 h-6 text-primary-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
          <div className="text-sm text-gray-400">Total Referrals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 text-center"
        >
          <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-400">
            {formatNumber(stats.totalEarnings)}
          </div>
          <div className="text-sm text-gray-400">Total Earned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4 text-center"
        >
          <TrendingUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-400">
            {stats.activeReferrals}
          </div>
          <div className="text-sm text-gray-400">Active Friends</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 text-center"
        >
          <Crown className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-400">
            {bonusEarnings > 0 ? `+${formatNumber(bonusEarnings)}` : '0'}
          </div>
          <div className="text-sm text-gray-400">VIP Bonus</div>
        </motion.div>
      </div>

      {/* Referral Code - FIXED WITH HTTPS LINK */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Share2 className="w-5 h-5 mr-2 text-primary-400" />
          Your Referral Link (HTTPS)
        </h3>
        
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-bold gradient-text mb-2 break-all">
                {referralLink || 'Generating link...'}
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <ExternalLink className="w-4 h-4 text-green-400" />
                <span>HTTPS Telegram Link - Works everywhere!</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <motion.button
              onClick={handleCopyReferralCode}
              disabled={!referralLink}
              className={cn(
                "p-3 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2",
                copied
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
            </motion.button>
            
            <motion.button
              onClick={handleShare}
              disabled={!referralLink}
              className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </motion.button>
          </div>
        </div>

        {/* Link Info */}
        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-blue-400 mb-1">✅ HTTPS Link Features:</h4>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Works in all browsers and messaging apps</li>
            <li>• Secure HTTPS protocol</li>
            <li>• Direct link to Telegram bot</li>
            <li>• No @ symbol issues</li>
          </ul>
        </div>
      </div>

      {/* Referral List */}
      {referrals.length > 0 && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary-400" />
              Your Referrals
            </span>
            <span className="text-sm text-gray-400">
              {referrals.length} total
            </span>
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {referrals.map((referral, index) => (
              <motion.div
                key={referral.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                    referral.active 
                      ? "bg-green-500/20 text-green-400"
                      : "bg-gray-700/50 text-gray-400"
                  )}>
                    {referral.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{referral.username}</div>
                    <div className="text-sm text-gray-400">
                      Joined {referral.joinedAt ? new Date(referral.joinedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-green-400">
                    +{formatNumber(referral.totalEarnings)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      referral.active ? "bg-green-400" : "bg-gray-400"
                    )} />
                    <span className="text-xs text-gray-400">
                      {referral.tier === 'free' ? 'Free' : 'VIP'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Rewards */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Gift className="w-5 h-5 mr-2 text-yellow-400" />
          Referral Rewards
        </h3>
        
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <div>
              <div className="font-medium text-white">Friend Joins</div>
              <div className="text-sm text-gray-400">When someone uses your code</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-blue-400">+50 coins</div>
              <div className="text-xs text-gray-400">Both get reward</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <div>
              <div className="font-medium text-white">Friend Earns</div>
              <div className="text-sm text-gray-400">10% of their farming earnings</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-400">10% share</div>
              <div className="text-xs text-gray-400">Passive income</div>
            </div>
          </div>
          
          {user.tier !== 'free' && (
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <div>
                <div className="font-medium text-white flex items-center">
                  VIP Bonus
                  <Crown className="w-4 h-4 ml-1 text-yellow-400" />
                </div>
                <div className="text-sm text-gray-400">
                  {tierConfig.referralMultiplier}× multiplier on all rewards
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-yellow-400">
                  {tierConfig.referralMultiplier}× boost
                </div>
                <div className="text-xs text-gray-400">VIP exclusive</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4"
      >
        <h5 className="font-semibold text-purple-400 mb-2">🚀 How It Works</h5>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Share your referral code with friends</li>
          <li>They join using your code and both get 50 coins</li>
          <li>Earn 10% of their farming rewards automatically</li>
          <li>VIP members get boosted referral rewards</li>
          <li>More active friends = more passive income!</li>
        </ol>
      </motion.div>
    </div>
  );
};

export default ReferralPanel;