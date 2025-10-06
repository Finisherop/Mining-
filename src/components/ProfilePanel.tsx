import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Crown, TrendingUp, Award, Star, Clock, Gift, RefreshCw, Camera } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, formatNumber, getVipTimeRemaining, isVipActive } from '../utils';
import { getTelegramWebAppData, getTelegramUserPhoto } from '../services/telegram';
import { TelegramUser } from '../types/telegram';
import { getCachedProfilePhoto, setCachedProfilePhoto, isCacheExpired } from '../utils/telegramProfileCache';

const ProfilePanel: React.FC = () => {
  const { user, setUser } = useAppStore();
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
  const [lastPhotoFetch, setLastPhotoFetch] = useState<number | null>(null);

  if (!user) return null;

  // Auto-fetch Telegram profile data
  useEffect(() => {
    const fetchTelegramProfile = async () => {
      try {
        console.log('🔄 Fetching Telegram profile data...');
        
        // Get Telegram WebApp data
        const telegramData = getTelegramWebAppData();
        if (telegramData?.user) {
          console.log('📱 Telegram user found:', telegramData.user);
          setTelegramUser(telegramData.user);
          
          // Update user data if different from Telegram
          const telegramName = telegramData.user.username || 
                              `${telegramData.user.first_name}${telegramData.user.last_name ? ' ' + telegramData.user.last_name : ''}`;
          
          if (user.username !== telegramName || user.userId !== telegramData.user.id.toString()) {
            console.log('🔄 Updating user data with Telegram info');
            const updatedUser = {
              ...user,
              username: telegramName,
              userId: telegramData.user.id.toString(),
              lastActive: Date.now()
            };
            setUser(updatedUser);
          }
          
          // Check cache first, then fetch if needed
          const cachedPhoto = getCachedProfilePhoto(telegramData.user.id);
          const cacheExpired = isCacheExpired(telegramData.user.id);
          
          if (cachedPhoto && !cacheExpired) {
            console.log('📸 Using cached profile photo');
            setProfilePhoto(cachedPhoto);
            if (user.photo_url !== cachedPhoto) {
              const updatedUser = {
                ...user,
                photo_url: cachedPhoto || undefined,
                lastActive: Date.now()
              };
              setUser(updatedUser);
            }
          } else {
            console.log('📸 Fetching fresh profile photo...');
            setIsLoadingPhoto(true);
            
            try {
              const photoUrl = await getTelegramUserPhoto(telegramData.user.id);
              console.log('✅ Profile photo fetched:', photoUrl);
              
              // Cache the result (even if null)
              setCachedProfilePhoto(telegramData.user.id, photoUrl);
              setProfilePhoto(photoUrl);
              setLastPhotoFetch(Date.now());
              
              // Update user with photo URL
              const updatedUser = {
                ...user,
                photo_url: photoUrl || undefined,
                lastActive: Date.now()
              };
              setUser(updatedUser);
            } catch (error) {
              console.error('❌ Error fetching profile photo:', error);
              // Cache the failure to avoid repeated attempts
              setCachedProfilePhoto(telegramData.user.id, null);
            } finally {
              setIsLoadingPhoto(false);
            }
          }
        } else {
          console.log('⚠️ No Telegram user data available');
        }
      } catch (error) {
        console.error('❌ Error fetching Telegram profile:', error);
      }
    };

    fetchTelegramProfile();
  }, [user, setUser, lastPhotoFetch]);

  // Manual refresh function
  const handleRefreshProfile = async () => {
    const telegramData = getTelegramWebAppData();
    if (telegramData?.user) {
      console.log('🔄 Manual profile refresh triggered');
      setIsLoadingPhoto(true);
      
      try {
        const photoUrl = await getTelegramUserPhoto(telegramData.user.id);
        console.log('✅ Profile photo refreshed:', photoUrl);
        
        // Update cache with fresh data
        setCachedProfilePhoto(telegramData.user.id, photoUrl);
        setProfilePhoto(photoUrl);
        setLastPhotoFetch(Date.now());
        
        const updatedUser = {
          ...user,
          photo_url: photoUrl || undefined,
          lastActive: Date.now()
        };
        setUser(updatedUser);
      } catch (error) {
        console.error('❌ Error refreshing profile photo:', error);
        setCachedProfilePhoto(telegramData.user.id, null);
      } finally {
        setIsLoadingPhoto(false);
      }
    }
  };

  const tierConfig = TIER_CONFIGS[user.tier];
  const isVip = user.tier !== 'free';
  const vipActive = isVipActive(user.vipExpiry && typeof user.vipExpiry === 'number' ? new Date(user.vipExpiry) : undefined);
  const vipTimeLeft = getVipTimeRemaining(user.vipExpiry && typeof user.vipExpiry === 'number' ? new Date(user.vipExpiry) : undefined);

  const stats = [
    {
      icon: <div className="coin-icon" />,
      label: 'Total Coins',
      value: formatNumber(user.coins),
      color: 'text-yellow-400'
    },
    {
      icon: <Star className="w-5 h-5" />,
      label: 'Stars',
      value: user.stars.toString(),
      color: 'text-yellow-400'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Farming Rate',
      value: `${user.farmingRate * tierConfig.farmingMultiplier}/min`,
      color: 'text-green-400'
    },
    {
      icon: <Gift className="w-5 h-5" />,
      label: 'Claim Streak',
      value: `${user.claimStreak} days`,
      color: 'text-blue-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Profile</h2>
        <p className="text-gray-400">User stats, VIP status, badges</p>
      </div>

      {/* Profile Card */}
      <div className="glass-panel p-6 space-y-6">
        {/* Avatar & Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden",
                isVip 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
                  : "bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200"
              )}
            >
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt={`${user.username}'s profile`}
                  className="w-full h-full object-cover"
                  onError={() => setProfilePhoto(null)}
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </motion.div>
            
            {/* Refresh button */}
            <motion.button
              onClick={handleRefreshProfile}
              disabled={isLoadingPhoto}
              className={cn(
                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs",
                "bg-primary-500 text-white hover:bg-primary-600 transition-colors",
                "border-2 border-gray-900"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Refresh profile photo"
            >
              {isLoadingPhoto ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </motion.button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-xl font-bold text-white">{user.username}</h3>
              {isVip && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-yellow-400"
                >
                  <Crown className="w-5 h-5" />
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                isVip 
                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30"
                  : "bg-gray-700/50 text-gray-400 border border-gray-600/30"
              )}>
                {tierConfig.name}
              </div>
              
              {vipActive && vipTimeLeft && (
                <div className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{vipTimeLeft}</span>
                </div>
              )}
            </div>
            
            <div className="text-sm text-gray-400">
              Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-4 text-center"
            >
              <div className={cn("flex items-center justify-center mb-2", stat.color)}>
                {stat.icon}
              </div>
              <div className={cn("text-lg font-bold", stat.color)}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Award className="w-5 h-5 mr-2 text-primary-400" />
          Badges & Achievements
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {user.badges.map((badge, index) => (
            <motion.div
              key={badge.type}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-lg p-4 text-center"
            >
              <div className="text-2xl mb-2">{badge.icon}</div>
              <div className="font-semibold text-white text-sm mb-1">
                {badge.name}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {badge.description}
              </div>
              <div className="text-xs text-gray-500">
                {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString() : 'N/A'}
              </div>
            </motion.div>
          ))}
          
          {/* Locked Badges */}
          {user.tier === 'free' && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: user.badges.length * 0.1 }}
                className="bg-gray-800/50 border border-gray-700/40 rounded-lg p-4 text-center opacity-60"
              >
                <div className="text-2xl mb-2">🥉</div>
                <div className="font-semibold text-gray-400 text-sm mb-1">
                  Platinum Badge
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Unlock with Bronze VIP
                </div>
                <div className="text-xs text-gray-600">Locked</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (user.badges.length + 1) * 0.1 }}
                className="bg-gray-800/50 border border-gray-700/40 rounded-lg p-4 text-center opacity-60"
              >
                <div className="text-2xl mb-2">💎</div>
                <div className="font-semibold text-gray-400 text-sm mb-1">
                  Diamond Badge
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Unlock with Diamond VIP
                </div>
                <div className="text-xs text-gray-600">Locked</div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Telegram Profile */}
      {telegramUser && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="w-5 h-5 mr-2 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold">T</div>
              Telegram Profile
            </h3>
            <motion.button
              onClick={handleRefreshProfile}
              disabled={isLoadingPhoto}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingPhoto && "animate-spin")} />
              <span>Sync</span>
            </motion.button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <span className="text-blue-400">First Name</span>
              <span className="text-white">{telegramUser.first_name}</span>
            </div>
            
            {telegramUser.last_name && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                <span className="text-blue-400">Last Name</span>
                <span className="text-white">{telegramUser.last_name}</span>
              </div>
            )}
            
            {telegramUser.username && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                <span className="text-blue-400">Username</span>
                <span className="text-white font-mono">@{telegramUser.username}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <span className="text-blue-400">Telegram ID</span>
              <span className="text-white font-mono">{telegramUser.id}</span>
            </div>
            
            {telegramUser.language_code && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                <span className="text-blue-400">Language</span>
                <span className="text-white uppercase">{telegramUser.language_code}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <span className="text-green-400">Profile Photo</span>
              <span className="text-white">
                {profilePhoto ? '✅ Loaded' : isLoadingPhoto ? '🔄 Loading...' : '❌ Not available'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Details */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <User className="w-5 h-5 mr-2 text-primary-400" />
          Account Details
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg">
            <span className="text-gray-400">User ID</span>
            <span className="text-white font-mono">{user.id}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg">
            <span className="text-gray-400">Referral Code</span>
            <span className="text-primary-400 font-mono">{user.referralCode}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg">
            <span className="text-gray-400">Total Referrals</span>
            <span className="text-white">{user.totalReferrals}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-lg">
            <span className="text-gray-400">Daily Withdrawals Used</span>
            <span className="text-white">
              {user.dailyWithdrawals}/{tierConfig.dailyWithdrawals}
            </span>
          </div>
        </div>
      </div>

      {/* VIP Benefits */}
      {isVip && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Crown className="w-5 h-5 mr-2 text-yellow-400" />
            VIP Benefits Active
          </h3>
          
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <span className="text-green-400">Farming Speed</span>
              <span className="text-white font-bold">{tierConfig.farmingMultiplier}× Boost</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <span className="text-blue-400">Daily Withdrawals</span>
              <span className="text-white font-bold">{tierConfig.dailyWithdrawals} per day</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
              <span className="text-yellow-400">Referral Bonus</span>
              <span className="text-white font-bold">{tierConfig.referralMultiplier}× Rewards</span>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade CTA for Free Users */}
      {!isVip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/40 rounded-lg p-6 text-center"
        >
          <div className="text-4xl mb-3">🚀</div>
          <h4 className="text-lg font-bold text-white mb-2">Upgrade to VIP</h4>
          <p className="text-sm text-gray-400 mb-4">
            Unlock premium badges, boost your farming, and earn more rewards!
          </p>
          <motion.button
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 tap-effect neon-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View VIP Plans
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePanel;