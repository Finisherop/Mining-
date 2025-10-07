import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Settings, 
  CheckSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  ExternalLink,
  Save,
  RefreshCw,
  Crown,
  CreditCard
} from 'lucide-react';
import { useFirebaseUsers, useFirebaseTasks, useFirebaseWithdrawals, addTask, updateTask, deleteTask, updateWithdrawal } from '../firebase/hooks';
import { createOrUpdateUser } from '../firebase/hooks';
import { useVipRequests } from '../firebase/vipHooks';
import { cn, playSound } from '../utils';
import { Task } from '../types';
import toast from 'react-hot-toast';

type AdminTab = 'dashboard' | 'tasks' | 'users'; // FIX: 3 tabs for top navigation
type FooterTab = 'withdrawals' | 'settings'; // FIX: 2 tabs for footer navigation

interface TaskFormData {
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'weekly' | 'special' | 'youtube' | 'channel_join' | 'group_join' | 'link';
  url: string;
  verification: 'auto' | 'manual';
  active: boolean;
}

const TabbedAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard'); // FIX: Start with dashboard
  const [activeFooterTab, setActiveFooterTab] = useState<FooterTab>('withdrawals'); // FIX: Footer tab state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    description: '',
    reward: 50,
    type: 'daily',
    url: '',
    verification: 'manual',
    active: true
  });

  const { users, loading: usersLoading } = useFirebaseUsers();
  const { tasks, loading: tasksLoading } = useFirebaseTasks();
  const { withdrawals, loading: withdrawalsLoading } = useFirebaseWithdrawals();
  const { requests: vipRequests } = useVipRequests();

  // FIX: Top 3 tabs configuration
  const topTabs = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: Users, count: Object.keys(users).length },
    { id: 'tasks' as AdminTab, label: 'Task Manager', icon: CheckSquare, count: tasks.length },
    { id: 'users' as AdminTab, label: 'User Control', icon: Crown, count: Object.values(vipRequests).filter(r => r.status === 'pending').length }
  ];

  // FIX: Footer 2 tabs configuration  
  const footerTabs = [
    { id: 'withdrawals' as FooterTab, label: 'Withdrawals', icon: CreditCard, count: Object.values(withdrawals).filter(w => w.status === 'pending').length },
    { id: 'settings' as FooterTab, label: 'Settings', icon: Settings, count: 0 }
  ];

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    playSound('click');
  };

  const handleAddTask = async () => {
    if (!taskForm.title.trim() || !taskForm.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTask: Omit<Task, 'id'> = {
      ...taskForm,
      completed: false,
      progress: 0,
      maxProgress: 1,
      icon: getTaskIcon(taskForm.type),
      createdAt: Date.now()
    };

    const taskId = await addTask(newTask);
    if (taskId) {
      toast.success('Task added successfully!');
      setIsAddingTask(false);
      resetTaskForm();
      playSound('success');
    } else {
      toast.error('Failed to add task');
      playSound('error');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !taskForm.title.trim() || !taskForm.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const success = await updateTask(editingTask.id, {
      ...taskForm,
      icon: getTaskIcon(taskForm.type)
    });

    if (success) {
      toast.success('Task updated successfully!');
      setEditingTask(null);
      resetTaskForm();
      playSound('success');
    } else {
      toast.error('Failed to update task');
      playSound('error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const success = await deleteTask(taskId);
      if (success) {
        toast.success('Task deleted successfully!');
        playSound('success');
      } else {
        toast.error('Failed to delete task');
        playSound('error');
      }
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    const success = await updateWithdrawal(withdrawalId, { 
      status: 'approved',
      processedAt: Date.now()
    });
    
    if (success) {
      toast.success('Withdrawal approved!');
      playSound('success');
    } else {
      toast.error('Failed to approve withdrawal');
      playSound('error');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    const success = await updateWithdrawal(withdrawalId, { 
      status: 'rejected',
      processedAt: Date.now()
    });
    
    if (success) {
      toast.success('Withdrawal rejected!');
      playSound('success');
    } else {
      toast.error('Failed to reject withdrawal');
      playSound('error');
    }
  };

  const handleActivateVip = async (userId: string, tier: 'bronze' | 'diamond') => {
    const vipExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const updates = {
      tier,
      vip_tier: tier,
      vip_expiry: vipExpiry,
      vipExpiry: vipExpiry,
      multiplier: tier === 'bronze' ? 2 : 2.5,
      withdraw_limit: tier === 'bronze' ? 3 : 5,
      referral_boost: tier === 'bronze' ? 1 : 1.5
    };

    try {
      await createOrUpdateUser(userId, updates);
      toast.success(`${tier.charAt(0).toUpperCase() + tier.slice(1)} VIP activated!`);
      playSound('success');
    } catch (error) {
      toast.error('Failed to activate VIP');
      playSound('error');
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      reward: 50,
      type: 'daily',
      url: '',
      verification: 'manual',
      active: true
    });
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'youtube': return '📺';
      case 'channel_join': return '📢';
      case 'group_join': return '👥';
      case 'link': return '🔗';
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'special': return '⭐';
      default: return '📋';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'youtube': return 'text-red-400 bg-red-500/10';
      case 'channel_join': return 'text-blue-400 bg-blue-500/10';
      case 'group_join': return 'text-green-400 bg-green-500/10';
      case 'link': return 'text-purple-400 bg-purple-500/10';
      case 'daily': return 'text-yellow-400 bg-yellow-500/10';
      case 'weekly': return 'text-orange-400 bg-orange-500/10';
      case 'special': return 'text-pink-400 bg-pink-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">🚀 Enhanced Admin Panel</h1>
          <p className="text-gray-400">Complete control with 3-tab top + 2-tab footer design</p>
        </div>

        {/* FIX: Top Navigation - 3 Tabs */}
        <div className="flex justify-center mb-6">
          <div className="glass-panel p-2 flex space-x-2">
            {topTabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg neon-glow"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                    {tab.count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${activeFooterTab}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-24" // Space for footer tabs
          >
            {activeTab === 'dashboard' && (
              <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold text-white mb-6">📊 Admin Dashboard</h2>
                
                {/* Dashboard Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{Object.keys(users).length}</div>
                    <div className="text-sm text-blue-400">Total Users</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                    <Crown className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {Object.values(users).filter((u: any) => u.tier !== 'free').length}
                    </div>
                    <div className="text-sm text-yellow-400">VIP Members</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <CheckSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{tasks.filter(t => t.active).length}</div>
                    <div className="text-sm text-green-400">Active Tasks</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                    <CreditCard className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">
                      {Object.values(withdrawals).filter(w => w.status === 'pending').length}
                    </div>
                    <div className="text-sm text-red-400">Pending Withdrawals</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-4">📈 System Overview</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Coins in System:</span>
                        <span className="text-primary-400">
                          {Object.values(users).reduce((sum: number, u: any) => sum + (u.coins || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Stars:</span>
                        <span className="text-yellow-400">
                          {Object.values(users).reduce((sum: number, u: any) => sum + (u.stars || 0), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">VIP Conversion Rate:</span>
                        <span className="text-green-400">
                          {((Object.values(users).filter((u: any) => u.tier !== 'free').length / Math.max(Object.keys(users).length, 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setActiveTab('tasks')}
                        className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors text-sm"
                      >
                        Manage Tasks
                      </button>
                      <button 
                        onClick={() => setActiveFooterTab('withdrawals')}
                        className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors text-sm"
                      >
                        Check Withdrawals
                      </button>
                      <button 
                        onClick={() => setActiveTab('users')}
                        className="p-3 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-colors text-sm"
                      >
                        Manage Users
                      </button>
                      <button 
                        onClick={() => setActiveFooterTab('settings')}
                        className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 transition-colors text-sm"
                      >
                        System Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-bold text-white">User Management</h2>
                  <div className="text-sm text-gray-400">
                    Total Users: {Object.keys(users).length}
                  </div>
                </div>

                {usersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {Object.entries(users).map(([userId, user]) => (
                      <motion.div
                        key={userId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-600/30 rounded-lg p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{user.username}</div>
                              <div className="text-sm text-gray-400">ID: {user.userId}</div>
                              <div className="text-sm text-gray-400">
                                Coins: {user.coins} | Stars: {user.stars} | Tier: {user.tier}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleActivateVip(userId, 'bronze')}
                              className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                            >
                              Bronze VIP
                            </button>
                            <button
                              onClick={() => handleActivateVip(userId, 'diamond')}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                            >
                              Diamond VIP
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Withdrawal Requests */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-white mb-4">Withdrawal Requests</h3>
                  {withdrawalsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-primary-400 animate-spin" />
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {withdrawals.filter(w => w.status === 'pending').map((withdrawal) => (
                        <motion.div
                          key={withdrawal.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div>
                              <div className="font-semibold text-white">₹{withdrawal.amount}</div>
                              <div className="text-sm text-gray-400">
                                Method: {withdrawal.method} | {withdrawal.requestedAt ? new Date(withdrawal.requestedAt).toLocaleDateString() : 'N/A'}
                              </div>
                              {withdrawal.details?.utrNumber && (
                                <div className="text-sm text-yellow-400">UTR: {withdrawal.details.utrNumber}</div>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                              >
                                <Check className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawal(withdrawal.id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-bold text-white">Task Management</h2>
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                </div>

                {/* Add/Edit Task Form */}
                {(isAddingTask || editingTask) && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-lg p-4 space-y-4"
                  >
                    <h3 className="text-lg font-bold text-white">
                      {editingTask ? 'Edit Task' : 'Add New Task'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                        <input
                          type="text"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                          placeholder="Task title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                        <select
                          value={taskForm.type}
                          onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value as any })}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="special">Special</option>
                          <option value="youtube">YouTube</option>
                          <option value="channel_join">Channel Join</option>
                          <option value="group_join">Group Join</option>
                          <option value="link">Custom Link</option>
                        </select>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                          rows={3}
                          placeholder="Task description"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reward (Coins)</label>
                        <input
                          type="number"
                          value={taskForm.reward}
                          onChange={(e) => setTaskForm({ ...taskForm, reward: parseInt(e.target.value) || 0 })}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">URL (if applicable)</label>
                        <input
                          type="url"
                          value={taskForm.url}
                          onChange={(e) => setTaskForm({ ...taskForm, url: e.target.value })}
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={editingTask ? handleUpdateTask : handleAddTask}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>{editingTask ? 'Update' : 'Add'} Task</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingTask(false);
                          setEditingTask(null);
                          resetTaskForm();
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Tasks List */}
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 border border-gray-600/30 rounded-lg p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl">{task.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-white">{task.title}</h3>
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  getTaskTypeColor(task.type)
                                )}>
                                  {task.type.replace('_', ' ')}
                                </span>
                                {!task.active && (
                                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                <span>Reward: {task.reward} coins</span>
                                {task.url && (
                                  <a
                                    href={task.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 text-primary-400 hover:text-primary-300"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>View Link</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setTaskForm({
                                  title: task.title,
                                  description: task.description,
                                  reward: task.reward,
                                  type: task.type,
                                  url: task.url || '',
                                  verification: task.verification || 'manual',
                                  active: task.active
                                });
                              }}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white">System Settings</h2>
                
                <div className="grid gap-6">
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Telegram Bot Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bot Token</label>
                        <input
                          type="text"
                          value="7795769615:AAH4hhnFG_10vl8tn_dFu8AHdUziQLh6VIA"
                          readOnly
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Admin UPI ID</label>
                        <input
                          type="text"
                          defaultValue="admin@upi"
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">VIP Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Bronze VIP Price (Stars)</label>
                        <input
                          type="number"
                          defaultValue="75"
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Diamond VIP Price (Stars)</label>
                        <input
                          type="number"
                          defaultValue="150"
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Firebase Connection</span>
                        <span className="text-green-400">✓ Connected</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Telegram Bot</span>
                        <span className="text-green-400">✓ Active</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Payment System</span>
                        <span className="text-green-400">✓ Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabbedAdminPanel;