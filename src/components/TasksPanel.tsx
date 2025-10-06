import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, Users, Sprout, Calendar, Trophy, Star } from 'lucide-react';
import { useAppStore } from '../store';
import { cn, formatNumber, triggerCoinBurst, playSound } from '../utils';

const TasksPanel: React.FC = () => {
  const { user, tasks, completeTask } = useAppStore();

  const handleCompleteTask = (taskId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    playSound('success');
    triggerCoinBurst(event.currentTarget);
    completeTask(taskId);
  };

  if (!user) return null;

  const dailyTasks = tasks.filter(t => t.type === 'daily');
  const weeklyTasks = tasks.filter(t => t.type === 'weekly');
  const specialTasks = tasks.filter(t => t.type === 'special');

  const getTaskIcon = (task: any) => {
    switch (task.icon) {
      case '📅': return <Calendar className="w-5 h-5" />;
      case '👥': return <Users className="w-5 h-5" />;
      case '🌾': return <Sprout className="w-5 h-5" />;
      default: return <CheckSquare className="w-5 h-5" />;
    }
  };

  const TaskCard = ({ task, index }: { task: any; index: number }) => {
    const progress = (task.progress / task.maxProgress) * 100;
    const isCompleted = task.completed;
    const canComplete = task.progress >= task.maxProgress && !isCompleted;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          "glass-panel p-4 transition-all duration-300",
          isCompleted && "bg-green-500/10 border-green-500/30",
          canComplete && "neon-glow hover-lift"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "p-2 rounded-lg",
              isCompleted 
                ? "bg-green-500/20 text-green-400"
                : canComplete
                ? "bg-primary-500/20 text-primary-400"
                : "bg-gray-700/50 text-gray-400"
            )}>
              {getTaskIcon(task)}
            </div>
            <div className="flex-1">
              <h4 className={cn(
                "font-semibold mb-1",
                isCompleted ? "text-green-400" : "text-white"
              )}>
                {task.title}
              </h4>
              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">
                    {task.progress}/{task.maxProgress}
                  </span>
                  <span className={cn(
                    "font-medium",
                    isCompleted ? "text-green-400" : "text-primary-400"
                  )}>
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isCompleted 
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-primary-500 to-secondary-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Task Type Badge */}
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            task.type === 'daily' && "bg-blue-500/20 text-blue-400",
            task.type === 'weekly' && "bg-purple-500/20 text-purple-400",
            task.type === 'special' && "bg-yellow-500/20 text-yellow-400"
          )}>
            {task.type}
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
          ) : canComplete ? (
            <motion.button
              onClick={(e) => handleCompleteTask(task.id, e)}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 tap-effect"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Claim Reward
            </motion.button>
          ) : (
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">In Progress</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Tasks & Missions</h2>
          <p className="text-gray-400">Complete tasks to earn extra coins and rewards</p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary-400">
              {tasks.filter(t => t.completed).length}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {tasks.filter(t => !t.completed).length}
            </div>
            <div className="text-xs text-gray-400">Remaining</div>
          </div>
        </div>
      </div>

      {/* Daily Tasks */}
      {dailyTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Daily Tasks</h3>
            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
              Resets in 12h
            </div>
          </div>
          <div className="space-y-3">
            {dailyTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
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
              Resets in 3d
            </div>
          </div>
          <div className="space-y-3">
            {weeklyTasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index + dailyTasks.length} />
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
              <TaskCard key={task.id} task={task} index={index + dailyTasks.length + weeklyTasks.length} />
            ))}
          </div>
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
          <li>• Daily tasks reset every 24 hours</li>
          <li>• Weekly challenges offer bigger rewards</li>
          <li>• Special events are time-limited opportunities</li>
          <li>• VIP members get bonus rewards on completion</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default TasksPanel;