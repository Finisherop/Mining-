import React, { useState } from 'react';
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
  TrendingUp
} from 'lucide-react';
import { User } from '../types/firebase';
import { updateUserField, createOrUpdateUser } from '../firebase/hooks';
import { cn, formatNumber } from '../utils';
import toast from 'react-hot-toast';

interface AdminPanelProps {
  users: Record<string, User>;
  loading: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, loading }) => {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<User>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const userList = Object.values(users);
  const totalUsers = userList.length;
  const vipUsers = userList.filter(u => u.isVIP && u.vipExpiry && u.vipExpiry > Date.now()).length;
  const totalStars = userList.reduce((sum, u) => sum + u.stars, 0);
  const totalEarnings = userList.reduce((sum, u) => sum + u.totalEarnings, 0);

  const handleEditStart = (user: User) => {
    setEditingUser(user.userId);
    setEditValues(user);
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setEditValues({});
  };

  const handleEditSave = async (userId: string) => {
    if (!editValues || isUpdating) return;

    try {
      setIsUpdating(true);
      
      // Update each changed field
      const currentUser = users[userId];
      const updates: Partial<User> = {};

      Object.keys(editValues).forEach(key => {
        const typedKey = key as keyof User;
        if (editValues[typedKey] !== currentUser[typedKey]) {
          updates[typedKey] = editValues[typedKey] as any;
        }
      });

      if (Object.keys(updates).length > 0) {
        updates.lastActive = Date.now();
        await createOrUpdateUser(userId, updates);
        toast.success('User updated successfully!');
      }

      setEditingUser(null);
      setEditValues({});
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickUpdate = async (userId: string, field: keyof User, delta: number) => {
    try {
      const currentUser = users[userId];
      const currentValue = currentUser[field] as number;
      const newValue = Math.max(0, currentValue + delta);
      
      await updateUserField(userId, field, newValue);
      toast.success(`${field} updated!`);
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Update failed');
    }
  };

  const toggleVIP = async (userId: string) => {
    try {
      const currentUser = users[userId];
      const newVIPStatus = !currentUser.isVIP;
      const vipExpiry = newVIPStatus ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null;
      const earningMultiplier = newVIPStatus ? 2 : 1;

      await createOrUpdateUser(userId, {
        isVIP: newVIPStatus,
        vipExpiry,
        earningMultiplier,
        lastActive: Date.now()
      });

      toast.success(`VIP ${newVIPStatus ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      console.error('Error toggling VIP:', error);
      toast.error('Failed to toggle VIP');
    }
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
          <Settings className="w-8 h-8 text-primary-400 mr-2" />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-gray-400">Manage all users and settings</p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 text-center"
        >
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">{totalUsers}</div>
          <div className="text-xs text-gray-400">Total Users</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4 text-center"
        >
          <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">{vipUsers}</div>
          <div className="text-xs text-gray-400">VIP Users</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 text-center"
        >
          <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">{formatNumber(totalStars)}</div>
          <div className="text-xs text-gray-400">Total Stars</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4 text-center"
        >
          <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">{formatNumber(totalEarnings)}</div>
          <div className="text-xs text-gray-400">Total Earnings</div>
        </motion.div>
      </div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-4"
      >
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 text-primary-400 mr-2" />
          <h2 className="text-lg font-semibold text-white">User Management</h2>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <AnimatePresence>
            {userList.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                {editingUser === user.userId ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold">{user.username}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSave(user.userId)}
                          disabled={isUpdating}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Stars</label>
                        <input
                          type="number"
                          value={editValues.stars || 0}
                          onChange={(e) => setEditValues(prev => ({ ...prev, stars: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Multiplier</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editValues.earningMultiplier || 1}
                          onChange={(e) => setEditValues(prev => ({ ...prev, earningMultiplier: parseFloat(e.target.value) || 1 }))}
                          className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Boosts</label>
                        <input
                          type="number"
                          value={editValues.boosts || 0}
                          onChange={(e) => setEditValues(prev => ({ ...prev, boosts: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Referrals</label>
                        <input
                          type="number"
                          value={editValues.referralCount || 0}
                          onChange={(e) => setEditValues(prev => ({ ...prev, referralCount: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editValues.isVIP || false}
                        onChange={(e) => setEditValues(prev => ({ 
                          ...prev, 
                          isVIP: e.target.checked,
                          earningMultiplier: e.target.checked ? 2 : 1,
                          vipExpiry: e.target.checked ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null
                        } as Partial<User>))}
                        className="rounded"
                      />
                      <label className="text-white text-sm">VIP Status</label>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <h3 className="text-white font-semibold mr-2">{user.username}</h3>
                        {user.isVIP && user.vipExpiry && user.vipExpiry > Date.now() && (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <button
                        onClick={() => handleEditStart(user)}
                        className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-yellow-400 font-semibold">{user.stars}</div>
                        <div className="text-xs text-gray-400">Stars</div>
                      </div>
                      <div className="text-center">
                        <div className="text-primary-400 font-semibold">{user.earningMultiplier}×</div>
                        <div className="text-xs text-gray-400">Multiplier</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-semibold">{user.boosts}</div>
                        <div className="text-xs text-gray-400">Boosts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 font-semibold">{user.referralCount}</div>
                        <div className="text-xs text-gray-400">Referrals</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleQuickUpdate(user.userId, 'stars', 10)}
                        className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>10 ⭐</span>
                      </button>
                      <button
                        onClick={() => handleQuickUpdate(user.userId, 'stars', -10)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                        <span>10 ⭐</span>
                      </button>
                      <button
                        onClick={() => toggleVIP(user.userId)}
                        className={cn(
                          "flex items-center space-x-1 px-3 py-1 rounded-lg text-xs transition-colors",
                          user.isVIP && (user.vipExpiry || 0) > Date.now()
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        )}
                      >
                        <Crown className="w-3 h-3" />
                        <span>{user.isVIP && user.vipExpiry && user.vipExpiry > Date.now() ? 'Remove VIP' : 'Make VIP'}</span>
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      ID: {user.userId} | Last Active: {new Date(user.lastActive).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {userList.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;