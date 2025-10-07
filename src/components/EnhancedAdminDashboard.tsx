import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  Crown, 
  TrendingUp, 
  DollarSign, 
  Settings,
  BarChart3,
  Wallet,
  Star,
  Activity,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSystemSettings, updateSystemSettings } from '../firebase/adminControlsHooks';
import { useAllUsers, useWithdrawals } from '../firebase/adminHooks';
import { cn, formatNumber } from '../utils';
import toast from 'react-hot-toast';

type AdminTab = 'dashboard' | 'settings' | 'users';
type FooterTab = 'analytics' | 'reports';

const EnhancedAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('analytics');
  const [isLoading, setIsLoading] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  // Firebase hooks
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { users, loading: usersLoading } = useAllUsers();
  const { withdrawals, loading: withdrawalsLoading } = useWithdrawals();

  // Local settings state for editing
  const [localSettings, setLocalSettings] = useState({
    coinsToINR: 100, // 100 coins = 1 INR
    starsToINR: 10,   // 10 stars = 1 INR
    farmingRates: { free: 10, bronze: 15, diamond: 20 },
    farmingMultipliers: { free: 1, bronze: 2, diamond: 2.5 },
    taskRewards: {
      daily: 25,
      weekly: 100,
      youtube: 50,
      telegram: 30,
      website: 20,
      ads: 5
    },
    withdrawalLimits: {
      free: { min: 200, max: 1000, daily: 1 },
      bronze: { min: 100, max: 2000, daily: 3 },
      diamond: { min: 200, max: 5000, daily: 5 }
    },
    vipPricing: {
      bronze: { stars: 75, inr: 750, duration: 30 },
      diamond: { stars: 150, inr: 1500, duration: 30 }
    }
  });

  // Update local settings when Firebase settings load
  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({
        ...prev,
        coinsToINR: settings.conversionRates?.coinsToINR || 100,
        starsToINR: settings.conversionRates?.starsToINR || 10,
        farmingRates: settings.farmingRates || prev.farmingRates,
        farmingMultipliers: settings.farmingMultipliers || prev.farmingMultipliers,
        taskRewards: settings.taskRewards || prev.taskRewards,
        withdrawalLimits: settings.withdrawalLimits || prev.withdrawalLimits,
        vipPricing: settings.vipPricing || prev.vipPricing
      }));
    }
  }, [settings]);

  // Calculate dashboard stats
  const stats = {
    totalUsers: Object.keys(users || {}).length,
    totalWithdrawals: Object.keys(withdrawals || {}).length,
    pendingWithdrawals: Object.values(withdrawals || {}).filter((w: any) => w.status === 'pending').length, // FIX: Add type annotation
    vipMembers: Object.values(users || {}).filter((u: any) => u.vip_tier !== 'free' && u.vip_expiry && u.vip_expiry > Date.now()).length, // FIX: Add type annotation
    totalCoinsInCirculation: Object.values(users || {}).reduce((sum: number, user: any) => sum + (user.coins || 0), 0), // FIX: Add type annotations
    totalWithdrawalAmount: Object.values(withdrawals || {}).reduce((sum: number, w: any) => sum + (w.amount || 0), 0) // FIX: Add type annotations
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      const success = await updateSystemSettings({
        conversionRates: {
          coinsToINR: localSettings.coinsToINR,
          starsToINR: localSettings.starsToINR
        },
        farmingRates: localSettings.farmingRates,
        farmingMultipliers: localSettings.farmingMultipliers,
        taskRewards: localSettings.taskRewards,
        withdrawalLimits: localSettings.withdrawalLimits,
        vipPricing: localSettings.vipPricing
      }, 'admin');

      if (success) {
        toast.success('✅ Settings saved successfully!');
      } else {
        toast.error('❌ Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('❌ Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 text-center"
        >
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{formatNumber(stats.totalUsers)}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 text-center"
        >
          <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-400">{formatNumber(stats.vipMembers)}</div>
          <div className="text-sm text-gray-400">VIP Members</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4 text-center"
        >
          <CreditCard className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-400">{formatNumber(stats.totalWithdrawals)}</div>
          <div className="text-sm text-gray-400">Total Withdrawals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 text-center"
        >
          <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-400">{formatNumber(stats.pendingWithdrawals)}</div>
          <div className="text-sm text-gray-400">Pending Withdrawals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4 text-center"
        >
          <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-400">{formatNumber(stats.totalCoinsInCirculation)}</div>
          <div className="text-sm text-gray-400">Coins in Circulation</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-4 text-center"
        >
          <Wallet className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-400">₹{formatNumber(stats.totalWithdrawalAmount)}</div>
          <div className="text-sm text-gray-400">Total Payouts</div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors">
            <Users className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Manage Users</span>
          </button>
          <button className="p-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors">
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Approve Withdrawals</span>
          </button>
          <button className="p-4 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-colors">
            <Crown className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">VIP Management</span>
          </button>
          <button className="p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors">
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsContent = () => (
    <div className="space-y-6">
      {/* Exchange Rate Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-white">Exchange Rates</h3>
          </div>
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {showSensitive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1 INR = ? Coins
              </label>
              <div className="relative">
                <input
                  type={showSensitive ? "number" : "password"}
                  value={localSettings.coinsToINR}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    coinsToINR: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="100"
                />
                <div className="absolute right-3 top-3 text-gray-400 text-sm">
                  coins/INR
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Current: {localSettings.coinsToINR} coins = ₹1
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1 INR = ? Stars
              </label>
              <div className="relative">
                <input
                  type={showSensitive ? "number" : "password"}
                  value={localSettings.starsToINR}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    starsToINR: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
                  placeholder="10"
                />
                <div className="absolute right-3 top-3 text-gray-400 text-sm">
                  stars/INR
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Current: {localSettings.starsToINR} stars = ₹1
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-400 mb-3">Live Calculator</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">1000 Coins =</span>
                <span className="text-green-400">₹{(1000 / localSettings.coinsToINR).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">100 Stars =</span>
                <span className="text-yellow-400">₹{(100 / localSettings.starsToINR).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">₹100 =</span>
                <span className="text-blue-400">{100 * localSettings.coinsToINR} coins</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Farming Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <Activity className="w-6 h-6 text-primary-400" />
          <h3 className="text-xl font-bold text-white">Farming Rates</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['free', 'bronze', 'diamond'] as const).map((tier) => (
            <div key={tier} className="space-y-4">
              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3",
                  tier === 'free' && "bg-gray-500/20 text-gray-400",
                  tier === 'bronze' && "bg-orange-500/20 text-orange-400",
                  tier === 'diamond' && "bg-blue-500/20 text-blue-400"
                )}>
                  {tier === 'free' && '👤'}
                  {tier === 'bronze' && '🥉'}
                  {tier === 'diamond' && '💎'}
                  <span className="ml-2 capitalize">{tier}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Base Rate (coins/min)</label>
                <input
                  type="number"
                  value={localSettings.farmingRates[tier]}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    farmingRates: {
                      ...prev.farmingRates,
                      [tier]: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.farmingMultipliers[tier]}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    farmingMultipliers: {
                      ...prev.farmingMultipliers,
                      [tier]: parseFloat(e.target.value) || 0
                    }
                  }))}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isLoading ? 'Saving...' : 'Save All Settings'}</span>
        </motion.button>
      </div>
    </div>
  );

  const UsersContent = () => (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-bold text-white mb-4">User Management</h3>
      <div className="text-gray-400">User management features coming soon...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage your application settings and users</p>
      </motion.div>

      {/* Top Navigation - 3 Tabs */}
      <div className="flex justify-center mb-6">
        <div className="glass-panel p-2 flex space-x-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'users', label: 'Users', icon: Users }
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id as AdminTab)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
                activeTab === id
                  ? "bg-primary-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'settings' && <SettingsContent />}
          {activeTab === 'users' && <UsersContent />}
        </motion.div>
      </AnimatePresence>

      {/* Footer Navigation - 2 Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 left-4 right-4 flex justify-center"
      >
        <div className="glass-panel p-2 flex space-x-2">
          {[
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'reports', label: 'Reports', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveFooterTab(id as FooterTab)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
                activeFooterTab === id
                  ? "bg-secondary-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {(settingsLoading || usersLoading || withdrawalsLoading) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div className="glass-panel p-6 text-center">
            <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
            <p className="text-white">Loading admin data...</p>
          </div>
        </motion.div>
      )}

      {/* Bottom Spacer for Footer */}
      <div className="h-20" />
    </div>
  );
};

export default EnhancedAdminDashboard;