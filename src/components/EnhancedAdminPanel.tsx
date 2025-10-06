import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Star, 
  Crown, 
  Edit3,
  Save,
  X,
  Plus,
  Minus,
  Settings,
  Database,
  TrendingUp,
  Shield,
  MessageSquare,
  Activity,
  Download,
  Ban,
  RotateCcw,
  Eye,
  EyeOff,
  Megaphone,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import { User, AdminLog, BroadcastMessage, TelegramPayment, UserTier } from '../types';
import { 
  getAllUsers, 
  updateUserVIP, 
  banUser, 
  resetUserStreak,
  getAdminLogs,
  createBroadcast,
  getBroadcasts,
  deactivateBroadcast,
  getPaymentHistory,
  getAdminStats
} from '../firebase/admin';
import { TIER_CONFIGS } from '../store';
import { cn, formatNumber } from '../utils';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  vipUsers: number;
  activeUsers: number;
  totalPayments: number;
  totalRevenue: number;
  recentLogs: AdminLog[];
}

const EnhancedAdminPanel: React.FC = () => {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [payments, setPayments] = useState<TelegramPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'broadcasts' | 'payments' | 'settings'>('users');
  
  // User management states
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<'all' | 'vip' | 'free' | 'banned'>('all');
  
  // Broadcast states
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<BroadcastMessage['type']>('info');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, logsData, broadcastsData, paymentsData] = await Promise.all([
        getAllUsers(),
        getAdminStats(),
        getAdminLogs(100),
        getBroadcasts(),
        getPaymentHistory()
      ]);

      setUsers(usersData);
      setStats(statsData);
      setLogs(logsData);
      setBroadcasts(broadcastsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVIPUpgrade = async (userId: string, tier: UserTier) => {
    try {
      await updateUserVIP(userId, tier as 'bronze' | 'diamond');
      await loadAdminData();
      toast.success(`User upgraded to ${tier} VIP!`);
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast.error('Failed to upgrade user');
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;

    try {
      await banUser(userId, reason);
      await loadAdminData();
      toast.success('User banned successfully');
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleResetStreak = async (userId: string) => {
    try {
      await resetUserStreak(userId);
      await loadAdminData();
      toast.success('User streak reset');
    } catch (error) {
      console.error('Error resetting streak:', error);
      toast.error('Failed to reset streak');
    }
  };

  const handleCreateBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createBroadcast(broadcastTitle, broadcastMessage, broadcastType);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setShowBroadcastForm(false);
      await loadAdminData();
      toast.success('Broadcast created successfully!');
    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast.error('Failed to create broadcast');
    }
  };

  const handleDeactivateBroadcast = async (broadcastId: string) => {
    try {
      await deactivateBroadcast(broadcastId);
      await loadAdminData();
      toast.success('Broadcast deactivated');
    } catch (error) {
      console.error('Error deactivating broadcast:', error);
      toast.error('Failed to deactivate broadcast');
    }
  };

  const filteredUsers = Object.values(users).filter(user => {
    switch (userFilter) {
      case 'vip':
        return user.vip_tier !== 'free' && user.vip_expiry && user.vip_expiry > Date.now();
      case 'free':
        return user.vip_tier === 'free' || !user.vip_expiry || user.vip_expiry <= Date.now();
      case 'banned':
        return (user as any).banned?.banned;
      default:
        return true;
    }
  });

  const exportData = (type: 'users' | 'payments' | 'logs') => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        data = Object.values(users);
        filename = 'users_export.csv';
        break;
      case 'payments':
        data = payments;
        filename = 'payments_export.csv';
        break;
      case 'logs':
        data = logs;
        filename = 'logs_export.csv';
        break;
    }

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(item => Object.values(item).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-panel p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center mb-2">
          <Shield className="w-8 h-8 text-primary-400 mr-2" />
          <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        </div>
        <p className="text-gray-400">Manage everything in real time</p>
      </motion.div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 text-center"
          >
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-xs text-gray-400">Total Users</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 text-center"
          >
            <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{stats.vipUsers}</div>
            <div className="text-xs text-gray-400">VIP Users</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 text-center"
          >
            <Activity className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{stats.activeUsers}</div>
            <div className="text-xs text-gray-400">Active Users</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 text-center"
          >
            <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{stats.totalPayments}</div>
            <div className="text-xs text-gray-400">Payments</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 text-center"
          >
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{stats.totalRevenue}</div>
            <div className="text-xs text-gray-400">Stars Revenue</div>
          </motion.div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="glass-panel p-2 mb-6">
        <div className="flex space-x-2">
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'logs', label: 'Activity Logs', icon: Activity },
            { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone },
            { id: 'payments', label: 'Payments', icon: DollarSign },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* User Filters & Actions */}
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as any)}
                    className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="vip">VIP Users</option>
                    <option value="free">Free Users</option>
                    <option value="banned">Banned Users</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportData('users')}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Showing {filteredUsers.length} of {Object.keys(users).length} users
              </div>
            </div>

            {/* Users List */}
            <div className="glass-panel p-4">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-white font-semibold">{user.username}</h3>
                        {user.vip_tier !== 'free' && user.vip_expiry && user.vip_expiry > Date.now() && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 rounded-full">
                            <Crown className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400">{TIER_CONFIGS[user.vip_tier].name}</span>
                          </div>
                        )}
                        {(user as any).banned?.banned && (
                          <div className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                            Banned
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <select
                          onChange={(e) => e.target.value && handleVIPUpgrade(user.id, e.target.value as UserTier)}
                          className="bg-gray-800 text-white rounded px-2 py-1 text-xs"
                          defaultValue=""
                        >
                          <option value="">Upgrade VIP</option>
                          <option value="bronze">Bronze VIP</option>
                          <option value="diamond">Diamond VIP</option>
                        </select>
                        
                        <button
                          onClick={() => handleResetStreak(user.id)}
                          className="p-1 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 transition-colors"
                          title="Reset Streak"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          title="Ban User"
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-center text-sm">
                      <div>
                        <div className="text-yellow-400 font-semibold">{user.stars}</div>
                        <div className="text-xs text-gray-400">Stars</div>
                      </div>
                      <div>
                        <div className="text-green-400 font-semibold">{user.coins}</div>
                        <div className="text-xs text-gray-400">Coins</div>
                      </div>
                      <div>
                        <div className="text-primary-400 font-semibold">{user.multiplier}×</div>
                        <div className="text-xs text-gray-400">Multiplier</div>
                      </div>
                      <div>
                        <div className="text-purple-400 font-semibold">{user.claimStreak}</div>
                        <div className="text-xs text-gray-400">Streak</div>
                      </div>
                      <div>
                        <div className="text-blue-400 font-semibold">{user.totalReferrals}</div>
                        <div className="text-xs text-gray-400">Referrals</div>
                      </div>
                      <div>
                        <div className="text-gray-300 font-semibold">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-400">Joined</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'broadcasts' && (
          <motion.div
            key="broadcasts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Create Broadcast */}
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Broadcast Messages</h3>
                <button
                  onClick={() => setShowBroadcastForm(!showBroadcastForm)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {showBroadcastForm ? 'Cancel' : 'Create Broadcast'}
                </button>
              </div>

              {showBroadcastForm && (
                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Title</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2"
                      placeholder="Enter broadcast title..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Message</label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 h-24"
                      placeholder="Enter broadcast message..."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as BroadcastMessage['type'])}
                      className="bg-gray-800 text-white rounded-lg px-3 py-2"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="promotion">Promotion</option>
                    </select>
                    
                    <button
                      onClick={handleCreateBroadcast}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Send Broadcast
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Active Broadcasts */}
            <div className="glass-panel p-4">
              <h4 className="text-lg font-semibold text-white mb-4">Active Broadcasts</h4>
              <div className="space-y-3">
                {broadcasts.map((broadcast) => (
                  <div
                    key={broadcast.id}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      broadcast.type === 'info' && "bg-blue-500/10 border-blue-500",
                      broadcast.type === 'warning' && "bg-yellow-500/10 border-yellow-500",
                      broadcast.type === 'success' && "bg-green-500/10 border-green-500",
                      broadcast.type === 'promotion' && "bg-purple-500/10 border-purple-500"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-white">{broadcast.title}</h5>
                      <button
                        onClick={() => handleDeactivateBroadcast(broadcast.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{broadcast.message}</p>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(broadcast.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Activity Logs</h3>
              <button
                onClick={() => exportData('logs')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <div className="text-white font-medium">{log.action}</div>
                    <div className="text-sm text-gray-400">
                      User: {log.username} ({log.userId})
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            key="payments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payment History</h3>
              <button
                onClick={() => exportData('payments')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.invoiceId}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <div className="text-white font-medium">{payment.description}</div>
                    <div className="text-sm text-gray-400">
                      User: {payment.userId} | Invoice: {payment.invoiceId}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-semibold",
                      payment.status === 'paid' ? "text-green-400" : "text-yellow-400"
                    )}>
                      {payment.amount} ⭐
                    </div>
                    <div className="text-xs text-gray-400">
                      {payment.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedAdminPanel;