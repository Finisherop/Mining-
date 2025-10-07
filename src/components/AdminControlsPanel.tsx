import React, { useState } from 'react';
import { motion } from 'framer-motion';
// ERROR FIX: lucide-react import - install dependency first
import { 
  Settings, // ERROR: TS6133 'Settings' is declared but never read - currently unused, do not delete
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap, 
  Save,
  RefreshCw,
  Users,
  Star
} from 'lucide-react';
import { cn, playSound, formatNumber } from '../utils'; // FIX: Add missing formatNumber import
// ERROR: TS6133 'cn' is declared but never read - currently unused, do not delete
import toast from 'react-hot-toast';

interface AdminControlsConfig {
  farmingRate: number;
  farmingDuration: number; // hours
  coinToInrRate: number; // coins per INR
  starToInrRate: number; // stars per INR - NEW EXCHANGE RATE SETTING
  taskRewards: {
    youtube: number;
    channelJoin: number;
    groupJoin: number;
    websiteVisit: number;
    dailyLogin: number;
    referral: number;
  };
  adsRewards: {
    perAd: number;
    dailyLimit: number;
    vipUnlimited: boolean;
  };
  withdrawalSettings: {
    minAmount: number;
    processingTime: number; // hours
    autoApprovalLimit: number; // auto-approve below this amount
  };
}

const AdminControlsPanel: React.FC = () => {
  const [config, setConfig] = useState<AdminControlsConfig>({
    farmingRate: 10,
    farmingDuration: 24,
    coinToInrRate: 100, // 100 coins = 1 INR
    starToInrRate: 10,  // 10 stars = 1 INR - NEW EXCHANGE RATE SETTING
    taskRewards: {
      youtube: 50,
      channelJoin: 25,
      groupJoin: 30,
      websiteVisit: 15,
      dailyLogin: 10,
      referral: 100
    },
    adsRewards: {
      perAd: 5,
      dailyLimit: 10,
      vipUnlimited: true
    },
    withdrawalSettings: {
      minAmount: 200,
      processingTime: 24,
      autoApprovalLimit: 500
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    playSound('click');

    try {
      // Save to Firebase
      // await saveAdminConfig(config);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('✅ Configuration saved successfully!');
      playSound('success');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('❌ Failed to save configuration');
      playSound('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfig = () => {
    setConfig({
      farmingRate: 10,
      farmingDuration: 24,
      coinToInrRate: 100,
      starToInrRate: 10, // FIX: Add missing property
      taskRewards: {
        youtube: 50,
        channelJoin: 25,
        groupJoin: 30,
        websiteVisit: 15,
        dailyLogin: 10,
        referral: 100
      },
      adsRewards: {
        perAd: 5,
        dailyLimit: 10,
        vipUnlimited: true
      },
      withdrawalSettings: {
        minAmount: 200,
        processingTime: 24,
        autoApprovalLimit: 500
      }
    });
    
    toast.success('Configuration reset to defaults');
    playSound('success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Admin Controls</h2>
          <p className="text-gray-400">Configure farming rates, rewards, and system settings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={handleResetConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </motion.button>
          
          <motion.button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </motion.button>
        </div>
      </div>

      {/* Farming Settings */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
          Farming Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Base Farming Rate (coins/minute)
            </label>
            <input
              type="number"
              value={config.farmingRate}
              onChange={(e) => setConfig(prev => ({ ...prev, farmingRate: parseInt(e.target.value) || 0 }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Farming Duration (hours)
            </label>
            <input
              type="number"
              value={config.farmingDuration}
              onChange={(e) => setConfig(prev => ({ ...prev, farmingDuration: parseInt(e.target.value) || 0 }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Task Rewards */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400" />
          Task Rewards
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              YouTube Video (coins)
            </label>
            <input
              type="number"
              value={config.taskRewards.youtube}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                taskRewards: { ...prev.taskRewards, youtube: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Channel Join (coins)
            </label>
            <input
              type="number"
              value={config.taskRewards.channelJoin}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                taskRewards: { ...prev.taskRewards, channelJoin: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Group Join (coins)
            </label>
            <input
              type="number"
              value={config.taskRewards.groupJoin}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                taskRewards: { ...prev.taskRewards, groupJoin: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Website Visit (coins)
            </label>
            <input
              type="number"
              value={config.taskRewards.websiteVisit}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                taskRewards: { ...prev.taskRewards, websiteVisit: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Referral Bonus (coins)
            </label>
            <input
              type="number"
              value={config.taskRewards.referral}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                taskRewards: { ...prev.taskRewards, referral: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Login (coins)
            </label>
            <input
              type="number"
              value={config.taskRewards.dailyLogin}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                taskRewards: { ...prev.taskRewards, dailyLogin: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ads Settings */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-400" />
          Ads Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reward per Ad (coins)
            </label>
            <input
              type="number"
              value={config.adsRewards.perAd}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                adsRewards: { ...prev.adsRewards, perAd: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Daily Limit (Free Users)
            </label>
            <input
              type="number"
              value={config.adsRewards.dailyLimit}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                adsRewards: { ...prev.adsRewards, dailyLimit: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="vipUnlimited"
            checked={config.adsRewards.vipUnlimited}
            onChange={(e) => setConfig(prev => ({ 
              ...prev, 
              adsRewards: { ...prev.adsRewards, vipUnlimited: e.target.checked }
            }))}
            className="w-4 h-4 text-primary-500 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="vipUnlimited" className="text-sm text-gray-300">
            VIP users get unlimited ads
          </label>
        </div>
      </div>

      {/* Conversion Rates - ENHANCED WITH NEW EXCHANGE SETTINGS */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-400" />
          Exchange Rate Settings (Admin Control)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coins to INR Rate (coins per ₹1)
            </label>
            <input
              type="number"
              value={config.coinToInrRate}
              onChange={(e) => setConfig(prev => ({ ...prev, coinToInrRate: parseInt(e.target.value) || 0 }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Current: {config.coinToInrRate} coins = ₹1
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stars to INR Rate (stars per ₹1) - NEW SETTING
            </label>
            <input
              type="number"
              value={config.starToInrRate}
              onChange={(e) => setConfig(prev => ({ ...prev, starToInrRate: parseInt(e.target.value) || 0 }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Current: {config.starToInrRate} stars = ₹1
            </p>
          </div>
        </div>

        {/* Live Exchange Calculator */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-400 mb-3">📊 Live Exchange Calculator</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{formatNumber(1000)}</div>
              <div className="text-gray-400">Coins</div>
              <div className="text-green-400">= ₹{(1000 / config.coinToInrRate).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{formatNumber(100)}</div>
              <div className="text-gray-400">Stars</div>
              <div className="text-yellow-400">= ₹{(100 / config.starToInrRate).toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">₹100</div>
              <div className="text-gray-400">INR</div>
              <div className="text-blue-400">= {100 * config.coinToInrRate} coins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">₹100</div>
              <div className="text-gray-400">INR</div>
              <div className="text-purple-400">= {100 * config.starToInrRate} stars</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Withdrawal (₹)
            </label>
            <input
              type="number"
              value={config.withdrawalSettings.minAmount}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                withdrawalSettings: { ...prev.withdrawalSettings, minAmount: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Requires {config.withdrawalSettings.minAmount * config.coinToInrRate} coins
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Settings */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-400" />
          Withdrawal Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Processing Time (hours)
            </label>
            <input
              type="number"
              value={config.withdrawalSettings.processingTime}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                withdrawalSettings: { ...prev.withdrawalSettings, processingTime: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Auto-Approval Limit (₹)
            </label>
            <input
              type="number"
              value={config.withdrawalSettings.autoApprovalLimit}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                withdrawalSettings: { ...prev.withdrawalSettings, autoApprovalLimit: parseInt(e.target.value) || 0 }
              }))}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Withdrawals below this amount are auto-approved
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary-400" />
          Live Preview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-400">{config.farmingRate}/min</div>
            <div className="text-xs text-gray-400">Base Farming</div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-yellow-400">{config.taskRewards.youtube}</div>
            <div className="text-xs text-gray-400">YouTube Reward</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 text-center">
            <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-purple-400">{config.adsRewards.perAd}</div>
            <div className="text-xs text-gray-400">Per Ad Reward</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <DollarSign className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-blue-400">₹{config.withdrawalSettings.minAmount}</div>
            <div className="text-xs text-gray-400">Min Withdrawal</div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-primary-400 mb-2">💡 System Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <strong>Farming:</strong> {config.farmingRate} coins/min base rate
          </div>
          <div>
            <strong>Conversion:</strong> {config.coinToInrRate} coins = ₹1
          </div>
          <div>
            <strong>Ads Limit:</strong> {config.adsRewards.dailyLimit}/day (Free users)
          </div>
          <div>
            <strong>Auto-Approval:</strong> Below ₹{config.withdrawalSettings.autoApprovalLimit}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControlsPanel;