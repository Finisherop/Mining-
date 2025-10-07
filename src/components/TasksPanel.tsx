import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  Trophy, 
  Star, 
  ExternalLink,
  Youtube,
  MessageCircle,
  Link,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store';
import { useFirebaseTasks, useUserTaskCompletion, useUserTaskVerification, completeUserTask, markTaskAsVerified } from '../firebase/hooks';
import { createOrUpdateUser } from '../firebase/hooks';
import { cn, formatNumber, triggerCoinBurst, playSound } from '../utils';
import AdsTaskPanel from './AdsTaskPanel';
import toast from 'react-hot-toast';
import { handleError, withErrorHandling } from '../utils/errorHandler';
import LoadingSkeleton, { InlineLoader } from './LoadingSkeleton';

const TasksPanel: React.FC = () => {
  const { user, setUser } = useAppStore();
  const { tasks, loading: tasksLoading, error: tasksError } = useFirebaseTasks();
  const { completedTasks, loading: completionLoading, error: completionError } = useUserTaskCompletion(user?.userId || null);
  const { verifiedTasks, loading: verificationLoading } = useUserTaskVerification(user?.userId || null);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [verifyingTask, setVerifyingTask] = useState<string | null>(null);

  // Move all useMemo hooks to top level to avoid hook order violations
  const activeTasks = useMemo(() => tasks.filter(task => task.active), [tasks]);
  const dailyTasks = useMemo(() => activeTasks.filter(t => t.type === 'daily'), [activeTasks]);
  const weeklyTasks = useMemo(() => activeTasks.filter(t => t.type === 'weekly'), [activeTasks]);
  const specialTasks = useMemo(() => activeTasks.filter(t => t.type === 'special'), [activeTasks]);
  const socialTasks = useMemo(() => activeTasks.filter(t => ['youtube', 'channel_join', 'group_join', 'link'].includes(t.type)), [activeTasks]);
  const completedCount = useMemo(() => activeTasks.filter(t => completedTasks.includes(t.id)).length, [activeTasks, completedTasks]);
  const remainingCount = useMemo(() => activeTasks.length - completedCount, [activeTasks, completedCount]);

  // FIX: Add error handling and loading state for blank screen issue
  if (tasksLoading || completionLoading || verificationLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tasks Skeleton */}
          <LoadingSkeleton type="list" />
          <LoadingSkeleton type="list" />
          
          {/* Ads Panel Skeleton */}
          <LoadingSkeleton type="panel" />
        </div>
      </div>
    );
  }

  // Enhanced error states with better UX
  if (tasksError || completionError) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-panel p-8 text-center max-w-md mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">Unable to Load Tasks</h3>
          <p className="text-gray-400 mb-6">
            {tasksError || completionError || 'Something went wrong while loading your tasks.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
            >
              🔄 Retry Loading
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🗑️ Clear Cache & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIX: Handle case when user is not available
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-panel p-6 text-center">
          <div className="text-yellow-400 text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-white mb-2">User Not Found</h3>
          <p className="text-gray-400">Please login to access tasks.</p>
        </div>
      </div>
    );
  }

  const handleCompleteTask = async (taskId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (!user || completingTask) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || completedTasks.includes(taskId)) return;

    setCompletingTask(taskId);
    playSound('click');
    triggerCoinBurst(event.currentTarget);

    try {
      // Update local state immediately for instant feedback
      const updatedUser = {
        ...user,
        coins: user.coins + task.reward,
        totalEarnings: user.totalEarnings + task.reward
      };
      setUser(updatedUser);
      
      // Complete task in Firebase with error handling
      const success = await completeUserTask(user.userId, taskId, task.reward);
      
      if (success) {
        // Sync with Firebase
        await createOrUpdateUser(user.userId, updatedUser);
        
        toast.success(`Task completed! +${task.reward} coins`, {
          icon: '🎉',
          duration: 3000
        });
        playSound('success');
      } else {
        // Revert local state if Firebase operation failed
        setUser(user);
        handleError(new Error('Task completion failed'), {
          component: 'TasksPanel',
          action: 'completeTask',
          userId: user.userId
        });
        playSound('error');
      }
    } catch (error) {
      // Revert local state on error
      setUser(user);
      handleError(
        error instanceof Error ? error : new Error('Task completion error'),
        { component: 'TasksPanel', action: 'completeTask', userId: user.userId }
      );
      playSound('error');
    } finally {
      setCompletingTask(null);
    }
  };

  // Handle task link verification
  const handleTaskVerification = async (task: any) => {
    if (!user || !task.url || verifyingTask) return;
    
    setVerifyingTask(task.id);
    playSound('click');
    
    try {
      // Open the link in new tab
      const newWindow = window.open(task.url, '_blank');
      
      if (newWindow) {
        toast.success('Link opened! Please complete the action and return here.');
        
        // Wait for user to return (simulate verification delay)
        setTimeout(async () => {
          try {
            // Mark task as verified
            const success = await markTaskAsVerified(user.userId, task.id);
            
            if (success) {
              toast.success('Task verified! You can now claim your reward.');
              playSound('success');
            } else {
              toast.error('Verification failed. Please try again.');
              playSound('error');
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast.error('Verification failed. Please try again.');
            playSound('error');
          } finally {
            setVerifyingTask(null);
          }
        }, 3000); // 3 second delay for verification
      } else {
        toast.error('Please allow popups to open the link.');
        setVerifyingTask(null);
      }
    } catch (error) {
      console.error('Error opening task link:', error);
      toast.error('Failed to open link.');
      setVerifyingTask(null);
    }
  };

  const handleTaskAction = (task: any) => {
    if (task.url) {
      window.open(task.url, '_blank');
      playSound('click');
    }
  };

  const getTaskIcon = (task: any) => {
    switch (task.type) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-400" />;
      case 'channel_join': return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'group_join': return <Users className="w-5 h-5 text-green-400" />;
      case 'link': return <Link className="w-5 h-5 text-purple-400" />;
      case 'daily': return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'weekly': return <Trophy className="w-5 h-5 text-purple-400" />;
      case 'special': return <Star className="w-5 h-5 text-yellow-400" />;
      default: return <CheckSquare className="w-5 h-5" />;
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'youtube': return 'bg-red-500/20 text-red-400';
      case 'channel_join': return 'bg-blue-500/20 text-blue-400';
      case 'group_join': return 'bg-green-500/20 text-green-400';
      case 'link': return 'bg-purple-500/20 text-purple-400';
      case 'daily': return 'bg-blue-500/20 text-blue-400';
      case 'weekly': return 'bg-purple-500/20 text-purple-400';
      case 'special': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const TaskCard = ({ task, index }: { task: any; index: number }) => {
    const isCompleted = completedTasks.includes(task.id);
    const isVerified = verifiedTasks.includes(task.id);
    const isCompletingThis = completingTask === task.id;
    const isVerifyingThis = verifyingTask === task.id;
    const hasUrl = Boolean(task.url);
    const needsVerification = hasUrl && !isVerified && !isCompleted;

    return (
      <motion.div
        key={`${task.id}-${isCompleted}`} // FIXED: Stable key to prevent blinking
        initial={false} // Prevent initial animation on re-renders
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.5) }} // Reduced delay to prevent lag
        className={cn(
          "glass-panel p-4 transition-all duration-300",
          isCompleted && "bg-green-500/10 border-green-500/30",
          !isCompleted && "hover-lift"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              isCompleted 
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-700/50"
            )}>
              {getTaskIcon(task)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={cn(
                  "font-semibold",
                  isCompleted ? "text-green-400" : "text-white"
                )}>
                  {task.title}
                </h4>
                {hasUrl && (
                  <button
                    onClick={() => handleTaskAction(task)}
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-400 hover:text-primary-400" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
              
              {/* Task URL Preview */}
              {hasUrl && (
                <div className="text-xs text-gray-500 mb-2 truncate">
                  🔗 {task.url}
                </div>
              )}
            </div>
          </div>
          
          {/* Task Type Badge */}
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            getTaskTypeColor(task.type)
          )}>
            {task.type.replace('_', ' ')}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="coin-icon" />
            <span className="font-semibold text-yellow-400">
              +{formatNumber(task.reward)} coins
            </span>
          </div>
          
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 text-green-400"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Completed</span>
            </motion.div>
          ) : needsVerification ? (
            <motion.button
              onClick={() => handleTaskVerification(task)}
              disabled={isVerifyingThis}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-300 tap-effect flex items-center space-x-2",
                isVerifyingThis
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              )}
              whileHover={!isVerifyingThis ? { scale: 1.05 } : {}}
              whileTap={!isVerifyingThis ? { scale: 0.95 } : {}}
            >
              {isVerifyingThis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Link</span>
                </>
              )}
            </motion.button>
          ) : isVerified ? (
            <motion.button
              onClick={(e) => handleCompleteTask(task.id, e)}
              disabled={isCompletingThis}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-300 tap-effect flex items-center space-x-2",
                isCompletingThis
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
              )}
              whileHover={!isCompletingThis ? { scale: 1.05 } : {}}
              whileTap={!isCompletingThis ? { scale: 0.95 } : {}}
            >
              {isCompletingThis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Claim Reward</span>
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              onClick={(e) => handleCompleteTask(task.id, e)}
              disabled={isCompletingThis}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all duration-300 tap-effect flex items-center space-x-2",
                isCompletingThis
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600"
              )}
              whileHover={!isCompletingThis ? { scale: 1.05 } : {}}
              whileTap={!isCompletingThis ? { scale: 0.95 } : {}}
            >
              {isCompletingThis ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <span>Claim Reward</span>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  };

  // Handle early returns AFTER all hooks
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Tasks & Missions</h2>
          <p className="text-sm sm:text-base text-gray-400">Complete tasks to earn extra coins and rewards</p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary-400">
              {completedCount}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {remainingCount}
            </div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
        </div>
      </div>

      {/* Social Tasks */}
      {socialTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-white">Social Tasks</h3>
            <div className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
              High Rewards
            </div>
          </div>
          <div className="space-y-3">
            {socialTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Daily Tasks */}
      {dailyTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Daily Tasks</h3>
            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
              Resets Daily
            </div>
          </div>
          <div className="space-y-3">
            {dailyTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index + socialTasks.length} />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Tasks */}
      {weeklyTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Weekly Challenges</h3>
            <div className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
              Big Rewards
            </div>
          </div>
          <div className="space-y-3">
            {weeklyTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index + socialTasks.length + dailyTasks.length} />
            ))}
          </div>
        </div>
      )}

      {/* Special Tasks */}
      {specialTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Special Events</h3>
            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
              Limited Time
            </div>
          </div>
          <div className="space-y-3">
            {specialTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index + socialTasks.length + dailyTasks.length + weeklyTasks.length} />
            ))}
          </div>
        </div>
      )}

      {/* No Tasks Message */}
      {activeTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Active Tasks</h3>
          <p className="text-gray-400">Check back later for new tasks and missions!</p>
        </div>
      )}

      {/* Task Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4"
      >
        <h5 className="font-semibold text-blue-400 mb-2">💡 Task Tips</h5>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Click "Open Link" to visit task URLs first</li>
          <li>• Complete the action (subscribe, join, etc.) on the opened page</li>
          <li>• Return here to see "Claim Reward" button after verification</li>
          <li>• Social tasks offer the highest rewards</li>
          <li>• Daily tasks reset every 24 hours</li>
          <li>• VIP members get bonus rewards on completion</li>
        </ul>
      </motion.div>

      {/* Daily Ads Section */}
      <AdsTaskPanel />
    </div>
  );
};

export default TasksPanel;