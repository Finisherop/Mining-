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
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Youtube,
  MessageCircle,
  Link,
  Trophy,
  CheckSquare
} from 'lucide-react';
import { useSystemSettings, updateSystemSettings } from '../firebase/adminControlsHooks';
import { useAllUsers, useWithdrawals } from '../firebase/adminHooks';
import { useFirebaseTasks, addTask, updateTask, deleteTask } from '../firebase/hooks';
import { cn, formatNumber } from '../utils';
import toast from 'react-hot-toast';

type AdminTab = 'dashboard' | 'settings' | 'tasks' | 'users';
type FooterTab = 'analytics' | 'reports';

interface TaskForm {
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'weekly' | 'youtube' | 'channel_join' | 'group_join' | 'link' | 'special';
  url?: string;
  active: boolean;
}

const SuperEnhancedAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('analytics');
  const [isLoading, setIsLoading] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);

  // Task management state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: '',
    description: '',
    reward: 0,
    type: 'daily',
    url: '',
    active: true
  });

  // Firebase hooks
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { users, loading: usersLoading } = useAllUsers();
  const { withdrawals, loading: withdrawalsLoading } = useWithdrawals();
  const { tasks, loading: tasksLoading } = useFirebaseTasks();

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
    pendingWithdrawals: Object.values(withdrawals || {}).filter((w: any) => w.status === 'pending').length,
    vipMembers: Object.values(users || {}).filter((u: any) => u.vip_tier !== 'free' && u.vip_expiry && u.vip_expiry > Date.now()).length,
    totalCoinsInCirculation: Object.values(users || {}).reduce((sum: number, user: any) => sum + (user.coins || 0), 0),
    totalWithdrawalAmount: Object.values(withdrawals || {}).reduce((sum: number, w: any) => sum + (w.amount || 0), 0),
    activeTasks: tasks.filter(t => t.active).length,
    totalTasks: tasks.length
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

  // Task management functions
  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      reward: 0,
      type: 'daily',
      url: '',
      active: true
    });
    setEditingTask(null);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.description || taskForm.reward <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const taskData = {
        ...taskForm,
        createdAt: Date.now(),
        progress: 0,
        maxProgress: 1,
        completed: false,
        icon: '📋' // Default icon
      };

      const taskId = await addTask(taskData);
      
      if (taskId) {
        toast.success('✅ Task created successfully!');
        resetTaskForm();
        setShowTaskForm(false);
      } else {
        toast.error('❌ Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('❌ Error creating task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      reward: task.reward,
      type: task.type,
      url: task.url || '',
      active: task.active
    });
    setShowTaskForm(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title || !taskForm.description || taskForm.reward <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateTask(editingTask.id, taskForm);
      
      if (success) {
        toast.success('✅ Task updated successfully!');
        resetTaskForm();
        setShowTaskForm(false);
      } else {
        toast.error('❌ Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('❌ Error updating task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsLoading(true);
    try {
      const success = await deleteTask(taskId);
      
      if (success) {
        toast.success('✅ Task deleted successfully!');
      } else {
        toast.error('❌ Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('❌ Error deleting task');
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-4 h-4 text-red-400" />;
      case 'channel_join': return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case 'group_join': return <Users className="w-4 h-4 text-green-400" />;
      case 'link': return <Link className="w-4 h-4 text-purple-400" />;
      case 'daily': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'weekly': return <Trophy className="w-4 h-4 text-purple-400" />;
      case 'special': return <Star className="w-4 h-4 text-yellow-400" />;
      default: return <CheckSquare className="w-4 h-4" />;
    }
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Stats Grid - ENHANCED */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 text-center"
        >
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white">{formatNumber(stats.totalUsers)}</div>
          <div className="text-xs text-gray-400">Total Users</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 text-center"
        >
          <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-yellow-400">{formatNumber(stats.vipMembers)}</div>
          <div className="text-xs text-gray-400">VIP Members</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4 text-center"
        >
          <CheckSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-green-400">{formatNumber(stats.activeTasks)}</div>
          <div className="text-xs text-gray-400">Active Tasks</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 text-center"
        >
          <CreditCard className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-orange-400">{formatNumber(stats.totalWithdrawals)}</div>
          <div className="text-xs text-gray-400">Withdrawals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-4 text-center"
        >
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-red-400">{formatNumber(stats.pendingWithdrawals)}</div>
          <div className="text-xs text-gray-400">Pending</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-4 text-center"
        >
          <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-purple-400">{formatNumber(stats.totalCoinsInCirculation)}</div>
          <div className="text-xs text-gray-400">Coins</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-4 text-center"
        >
          <Wallet className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-xl font-bold text-green-500">₹{formatNumber(stats.totalWithdrawalAmount)}</div>
          <div className="text-xs text-gray-400">Payouts</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-panel p-4 text-center"
        >
          <Activity className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-cyan-400">{Math.round((stats.vipMembers / Math.max(stats.totalUsers, 1)) * 100)}%</div>
          <div className="text-xs text-gray-400">VIP Rate</div>
        </motion.div>
      </div>

      {/* Quick Actions - ENHANCED */}
      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('tasks')}
            className="p-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
          >
            <CheckSquare className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Manage Tasks</span>
          </button>
          <button className="p-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors">
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Approve Withdrawals</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className="p-4 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-colors"
          >
            <Users className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Manage Users</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className="p-4 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors"
          >
            <Settings className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">System Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const TasksContent = () => (
    <div className="space-y-6">
      {/* Task Management Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Task Management</h3>
          <p className="text-gray-400">Create and manage tasks for users</p>
        </div>
        <motion.button
          onClick={() => {
            resetTaskForm();
            setShowTaskForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </motion.button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasksLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-primary-400 animate-spin" />
          </div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "glass-panel p-4",
                task.active ? "border-green-500/30" : "border-gray-600/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTaskIcon(task.type)}
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      task.active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                    )}>
                      {task.type}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{task.title}</h4>
                    <p className="text-sm text-gray-400">{task.description}</p>
                    {task.url && (
                      <p className="text-xs text-blue-400 truncate w-64">{task.url}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">+{task.reward} coins</div>
                    <div className="text-xs text-gray-400">
                      {task.active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Task Form Modal */}
      <AnimatePresence>
        {showTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTaskForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Task Type
                    </label>
                    <select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="youtube">YouTube</option>
                      <option value="channel_join">Channel Join</option>
                      <option value="group_join">Group Join</option>
                      <option value="link">Website Link</option>
                      <option value="special">Special Event</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                    rows={3}
                    placeholder="Enter task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Reward (coins)
                    </label>
                    <input
                      type="number"
                      value={taskForm.reward}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL (optional)
                    </label>
                    <input
                      type="url"
                      value={taskForm.url}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="active"
                    checked={taskForm.active}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-300">
                    Task is active and visible to users
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingTask ? 'Update Task' : 'Create Task'}</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
              <input
                type={showSensitive ? "number" : "password"}
                value={localSettings.coinsToINR}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  coinsToINR: parseInt(e.target.value) || 0 
                }))}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1 INR = ? Stars
              </label>
              <input
                type={showSensitive ? "number" : "password"}
                value={localSettings.starsToINR}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  starsToINR: parseInt(e.target.value) || 0 
                }))}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary-500 focus:outline-none"
              />
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <div className="flex justify-end">
        <motion.button
          onClick={handleSaveSettings}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-colors disabled:opacity-50"
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
        <h1 className="text-3xl font-bold text-white mb-2">🚀 Super Enhanced Admin Panel</h1>
        <p className="text-gray-400">Complete control over your Mining Tech Bot</p>
      </motion.div>

      {/* Top Navigation - 4 Tabs */}
      <div className="flex justify-center mb-6">
        <div className="glass-panel p-2 flex space-x-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
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
          {activeTab === 'tasks' && <TasksContent />}
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

export default SuperEnhancedAdminPanel;