import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Users, 
  Star, 
  Crown, 
  DollarSign,
  TrendingUp,
  Shield,
  Database,
  Edit3,
  Check,
  X,
  Plus,
  Minus,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Ban,
  UserCheck,
  Coins
} from 'lucide-react';
import { useSystemSettings, updateSystemSettings, useAdminActions } from '../firebase/adminControlsHooks';
import { useFirebaseUsers } from '../firebase/hooks';
import { SystemSettings } from '../types/adminControls';
import { User } from '../types/firebase';
import { cn, formatNumber } from '../utils';
import toast from 'react-hot-toast';

interface SuperAdminPanelProps {
  adminUser: User;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ adminUser }) => {
  const { settings, loading: settingsLoading, error: settingsError } = useSystemSettings();
  const { users, loading: usersLoading } = useFirebaseUsers();
  const { actions, loading: actionsLoading } = useAdminActions();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'users' | 'actions'>('overview');
  const [editedSettings, setEditedSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Initialize edited settings when settings load
  useEffect(() => {
    if (settings && !editedSettings) {
      setEditedSettings({ ...settings });
    }
  }, [settings, editedSettings]);

  const userList = Object.values(users);
  const totalUsers = userList.length;
  const vipUsers = userList.filter(u => u.isVIP && u.vipExpiry && u.vipExpiry > Date.now()).length;
  const totalCoins = userList.reduce((sum, u) => sum + (u.coins || 0), 0);
  const totalStars = userList.reduce((sum, u) => sum + (u.stars || 0), 0);
  const totalEarnings = userList.reduce((sum, u) => sum + (u.totalEarnings || 0), 0);

  const handleSaveSettings = async () => {
    if (!editedSettings || isSaving) return;

    setIsSaving(true);
    try {
      const updatedSettings = {
        ...editedSettings,
        lastUpdated: Date.now(),
        updatedBy: adminUser.userId
      };

      const success = await updateSystemSettings(updatedSettings, adminUser.userId);
      
      if (success) {
        toast.success('Settings saved successfully!');
        setEditedSettings(null);
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (settings) {
      setEditedSettings({ ...settings });
        toast('Settings reset to current values');
    }
  };

  const updateSettingValue = (path: string, value: any) => {
    if (!editedSettings) return;

    const pathArray = path.split('.');
    const newSettings = { ...editedSettings };
    let current: any = newSettings;

    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    setEditedSettings(newSettings);
  };

  const getSettingValue = (path: string): any => {
    if (!editedSettings) return '';
    
    const pathArray = path.split('.');
    let current: any = editedSettings;
    
    for (const key of pathArray) {
      current = current?.[key];
    }
    
    return current ?? '';
  };

  const hasUnsavedChanges = () => {
    return editedSettings && JSON.stringify(editedSettings) !== JSON.stringify(settings);
  };

  const SettingInput: React.FC<{
    label: string;
    path: string;
    type?: 'number' | 'text' | 'boolean';
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    description?: string;
  }> = ({ label, path, type = 'number', min, max, step, suffix, description }) => {
    const value = getSettingValue(path);

    if (type === 'boolean') {
      return (
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-white">{label}</span>
              {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => updateSettingValue(path, !value)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                value ? "bg-primary-500" : "bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  value ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </label>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">{label}</span>
            {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
          </div>
          {description && <p className="text-xs text-gray-400 mb-2">{description}</p>}
          <input
            type={type}
            value={value}
            onChange={(e) => updateSettingValue(path, type === 'number' ? Number(e.target.value) : e.target.value)}
            min={min}
            max={max}
            step={step}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </label>
      </div>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{formatNumber(totalUsers)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">VIP Users</p>
              <p className="text-2xl font-bold text-white">{formatNumber(vipUsers)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center space-x-3">
            <Coins className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Total Coins</p>
              <p className="text-2xl font-bold text-white">{formatNumber(totalCoins)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4"
        >
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-white">₹{formatNumber(totalEarnings)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('settings')}
            className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-all"
          >
            <Settings className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-white">Settings</p>
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 transition-all"
          >
            <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white">Manage Users</p>
          </button>
          
          <button
            onClick={() => updateSettingValue('maintenanceMode', !getSettingValue('maintenanceMode'))}
            className={cn(
              "p-4 border rounded-lg transition-all",
              getSettingValue('maintenanceMode')
                ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30"
                : "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30"
            )}
          >
            <Shield className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <p className="text-sm text-white">
              {getSettingValue('maintenanceMode') ? 'Exit Maintenance' : 'Maintenance Mode'}
            </p>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          >
            <RefreshCw className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-white">Refresh Data</p>
          </button>
        </div>
      </div>

      {/* System Status */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Maintenance Mode</span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getSettingValue('maintenanceMode')
                ? "bg-red-500/20 text-red-400"
                : "bg-green-500/20 text-green-400"
            )}>
              {getSettingValue('maintenanceMode') ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Registration</span>
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getSettingValue('registrationOpen')
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            )}>
              {getSettingValue('registrationOpen') ? 'Open' : 'Closed'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Coin Exchange Rate</span>
            <span className="text-white">
              {getSettingValue('conversionRates.coinsToINR')} coins = ₹1
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Star Exchange Rate</span>
            <span className="text-white">
              {getSettingValue('conversionRates.starsToINR')} stars = ₹1
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const UsersTab = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'vip' | 'free' | 'banned'>('all');
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<User>>({});
    const [isUpdating, setIsUpdating] = useState(false);

    const filteredUsers = userList.filter(user => {
      const matchesSearch = 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'vip' && user.isVIP && user.vipExpiry && user.vipExpiry > Date.now()) ||
        (filterType === 'free' && (!user.isVIP || !user.vipExpiry || user.vipExpiry <= Date.now())) ||
        (filterType === 'banned' && user.banned);

      return matchesSearch && matchesFilter;
    });

    const handleEditStart = (user: User) => {
      setEditingUser(user.userId);
      setEditValues({
        firstName: user.firstName,
        lastName: user.lastName,
        coins: user.coins,
        stars: user.stars,
        totalEarnings: user.totalEarnings,
        isVIP: user.isVIP,
        vipType: user.vipType,
        vipExpiry: user.vipExpiry,
        banned: user.banned
      });
    };

    const handleEditCancel = () => {
      setEditingUser(null);
      setEditValues({});
    };

    const handleEditSave = async (userId: string) => {
      if (!editValues || isUpdating) return;

      setIsUpdating(true);
      try {
        // Here you would call your update user function
        // await updateUser(userId, editValues);
        toast.success('User updated successfully!');
        setEditingUser(null);
        setEditValues({});
      } catch (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user');
      } finally {
        setIsUpdating(false);
      }
    };

    const handleBanUser = async (userId: string, banned: boolean) => {
      try {
        // await updateUserField(userId, 'banned', banned);
        toast.success(`User ${banned ? 'banned' : 'unbanned'} successfully!`);
      } catch (error) {
        console.error('Error updating user ban status:', error);
        toast.error('Failed to update user status');
      }
    };

    const handleGrantVIP = async (userId: string, vipType: 'bronze' | 'diamond', duration: number) => {
      try {
        const vipExpiry = Date.now() + (duration * 24 * 60 * 60 * 1000);
        // await updateUser(userId, { isVIP: true, vipType, vipExpiry });
        toast.success(`${vipType} VIP granted for ${duration} days!`);
      } catch (error) {
        console.error('Error granting VIP:', error);
        toast.error('Failed to grant VIP');
      }
    };

    return (
      <div className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="glass-panel p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All Users</option>
                <option value="vip">VIP Users</option>
                <option value="free">Free Users</option>
                <option value="banned">Banned Users</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-400">
              Showing {filteredUsers.length} of {totalUsers} users
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user.firstName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      {user.isVIP && user.vipExpiry && user.vipExpiry > Date.now() && (
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          user.vipType === 'diamond' 
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {user.vipType?.toUpperCase()} VIP
                        </span>
                      )}
                      {user.banned && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          BANNED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">ID: {user.userId}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-yellow-400 text-sm">
                        💰 {formatNumber(user.coins || 0)} coins
                      </span>
                      <span className="text-blue-400 text-sm">
                        ⭐ {formatNumber(user.stars || 0)} stars
                      </span>
                      <span className="text-green-400 text-sm">
                        ₹{formatNumber(user.totalEarnings || 0)} earned
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingUser === user.userId ? (
                    <>
                      <button
                        onClick={() => handleEditSave(user.userId)}
                        disabled={isUpdating}
                        className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
                      >
                        {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditStart(user)}
                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {!user.isVIP && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleGrantVIP(user.userId, 'bronze', 30)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs"
                          >
                            Bronze VIP
                          </button>
                          <button
                            onClick={() => handleGrantVIP(user.userId, 'diamond', 30)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-xs"
                          >
                            Diamond VIP
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleBanUser(user.userId, !user.banned)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          user.banned
                            ? "bg-green-600 hover:bg-green-500"
                            : "bg-red-600 hover:bg-red-500"
                        )}
                      >
                        {user.banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Edit Form */}
              {editingUser === user.userId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-600"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editValues.firstName || ''}
                        onChange={(e) => setEditValues({ ...editValues, firstName: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editValues.lastName || ''}
                        onChange={(e) => setEditValues({ ...editValues, lastName: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Coins
                      </label>
                      <input
                        type="number"
                        value={editValues.coins || 0}
                        onChange={(e) => setEditValues({ ...editValues, coins: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Stars
                      </label>
                      <input
                        type="number"
                        value={editValues.stars || 0}
                        onChange={(e) => setEditValues({ ...editValues, stars: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Total Earnings (₹)
                      </label>
                      <input
                        type="number"
                        value={editValues.totalEarnings || 0}
                        onChange={(e) => setEditValues({ ...editValues, totalEarnings: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        VIP Type
                      </label>
                      <select
                        value={editValues.vipType || 'free'}
                        onChange={(e) => setEditValues({ 
                          ...editValues, 
                          vipType: e.target.value as any,
                          isVIP: e.target.value !== 'free'
                        })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="free">Free</option>
                        <option value="bronze">Bronze VIP</option>
                        <option value="diamond">Diamond VIP</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Users Found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search terms' : 'No users match the selected filter'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const SettingsTab = () => (
    <div className="space-y-6">
      {/* Save/Reset Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-primary-400" />
          <h2 className="text-xl font-bold text-white">System Settings</h2>
          {hasUnsavedChanges() && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              Unsaved Changes
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSensitive(!showSensitive)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showSensitive ? 'Hide' : 'Show'} Sensitive</span>
          </button>
          
          <button
            onClick={handleResetSettings}
            disabled={!hasUnsavedChanges()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges() || isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Farming Settings */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span>Farming Settings</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingInput
            label="Free User Rate"
            path="farmingRates.free"
            min={1}
            max={100}
            suffix="coins/min"
            description="Base farming rate for free users"
          />
          <SettingInput
            label="Bronze VIP Rate"
            path="farmingRates.bronze"
            min={1}
            max={100}
            suffix="coins/min"
            description="Farming rate for Bronze VIP users"
          />
          <SettingInput
            label="Diamond VIP Rate"
            path="farmingRates.diamond"
            min={1}
            max={100}
            suffix="coins/min"
            description="Farming rate for Diamond VIP users"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <SettingInput
            label="Free Multiplier"
            path="farmingMultipliers.free"
            min={1}
            max={10}
            step={0.1}
            suffix="x"
            description="Farming multiplier for free users"
          />
          <SettingInput
            label="Bronze Multiplier"
            path="farmingMultipliers.bronze"
            min={1}
            max={10}
            step={0.1}
            suffix="x"
            description="Farming multiplier for Bronze VIP"
          />
          <SettingInput
            label="Diamond Multiplier"
            path="farmingMultipliers.diamond"
            min={1}
            max={10}
            step={0.1}
            suffix="x"
            description="Farming multiplier for Diamond VIP"
          />
        </div>
      </div>

      {/* Task Rewards */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Task Rewards</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SettingInput
            label="Daily Task Reward"
            path="taskRewards.daily"
            min={1}
            max={1000}
            suffix="coins"
          />
          <SettingInput
            label="Weekly Task Reward"
            path="taskRewards.weekly"
            min={1}
            max={1000}
            suffix="coins"
          />
          <SettingInput
            label="YouTube Task Reward"
            path="taskRewards.youtube"
            min={1}
            max={1000}
            suffix="coins"
          />
          <SettingInput
            label="Telegram Task Reward"
            path="taskRewards.telegram"
            min={1}
            max={1000}
            suffix="coins"
          />
          <SettingInput
            label="Website Task Reward"
            path="taskRewards.website"
            min={1}
            max={1000}
            suffix="coins"
          />
          <SettingInput
            label="Ads Reward"
            path="taskRewards.ads"
            min={1}
            max={100}
            suffix="coins"
          />
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <span>Exchange Rates</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingInput
            label="Coins to INR Rate"
            path="conversionRates.coinsToINR"
            min={1}
            max={1000}
            suffix="coins = ₹1"
            description="How many coins equal 1 rupee"
          />
          <SettingInput
            label="Stars to INR Rate"
            path="conversionRates.starsToINR"
            min={1}
            max={100}
            suffix="stars = ₹1"
            description="How many stars equal 1 rupee"
          />
        </div>
      </div>

      {/* VIP Pricing */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Crown className="w-5 h-5 text-purple-400" />
          <span>VIP Pricing</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-yellow-400">Bronze VIP</h4>
            <SettingInput
              label="Price in Stars"
              path="vipPricing.bronze.stars"
              min={1}
              max={1000}
              suffix="stars"
            />
            <SettingInput
              label="Price in INR"
              path="vipPricing.bronze.inr"
              min={1}
              max={10000}
              suffix="₹"
            />
            <SettingInput
              label="Duration"
              path="vipPricing.bronze.duration"
              min={1}
              max={365}
              suffix="days"
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-purple-400">Diamond VIP</h4>
            <SettingInput
              label="Price in Stars"
              path="vipPricing.diamond.stars"
              min={1}
              max={1000}
              suffix="stars"
            />
            <SettingInput
              label="Price in INR"
              path="vipPricing.diamond.inr"
              min={1}
              max={10000}
              suffix="₹"
            />
            <SettingInput
              label="Duration"
              path="vipPricing.diamond.duration"
              min={1}
              max={365}
              suffix="days"
            />
          </div>
        </div>
      </div>

      {/* Withdrawal Limits */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-400" />
          <span>Withdrawal Limits</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-300">Free Users</h4>
            <SettingInput
              label="Minimum Amount"
              path="withdrawalLimits.free.min"
              min={1}
              max={10000}
              suffix="₹"
            />
            <SettingInput
              label="Maximum Amount"
              path="withdrawalLimits.free.max"
              min={1}
              max={100000}
              suffix="₹"
            />
            <SettingInput
              label="Daily Limit"
              path="withdrawalLimits.free.daily"
              min={1}
              max={10}
              suffix="withdrawals"
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-yellow-400">Bronze VIP</h4>
            <SettingInput
              label="Minimum Amount"
              path="withdrawalLimits.bronze.min"
              min={1}
              max={10000}
              suffix="₹"
            />
            <SettingInput
              label="Maximum Amount"
              path="withdrawalLimits.bronze.max"
              min={1}
              max={100000}
              suffix="₹"
            />
            <SettingInput
              label="Daily Limit"
              path="withdrawalLimits.bronze.daily"
              min={1}
              max={10}
              suffix="withdrawals"
            />
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-purple-400">Diamond VIP</h4>
            <SettingInput
              label="Minimum Amount"
              path="withdrawalLimits.diamond.min"
              min={1}
              max={10000}
              suffix="₹"
            />
            <SettingInput
              label="Maximum Amount"
              path="withdrawalLimits.diamond.max"
              min={1}
              max={100000}
              suffix="₹"
            />
            <SettingInput
              label="Daily Limit"
              path="withdrawalLimits.diamond.daily"
              min={1}
              max={10}
              suffix="withdrawals"
            />
          </div>
        </div>
      </div>

      {/* System Controls */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5 text-red-400" />
          <span>System Controls</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingInput
            label="Maintenance Mode"
            path="maintenanceMode"
            type="boolean"
            description="Enable to prevent user access"
          />
          <SettingInput
            label="Registration Open"
            path="registrationOpen"
            type="boolean"
            description="Allow new user registrations"
          />
        </div>
      </div>
    </div>
  );

  if (settingsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-panel p-6 text-center">
          <RefreshCw className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-2" />
          <p className="text-white">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Super Admin Panel</h1>
              <p className="text-gray-400">Complete system control and management</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-white font-medium">{adminUser.firstName} {adminUser.lastName}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'actions', label: 'Actions', icon: Database }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md transition-all",
                activeTab === id
                  ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'settings' && <SettingsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'actions' && (
              <div className="glass-panel p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Admin Actions Log</h3>
                <p className="text-gray-400">Action history and logs will be displayed here.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SuperAdminPanel;