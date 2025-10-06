import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  ExternalLink, 
  Youtube, 
  MessageCircle, 
  Link, 
  Play,
  Key,
  Clock,
  Loader2
} from 'lucide-react';
import { EnhancedTask, TaskProgress } from '../types/taskVerification';
import { cn, formatNumber, playSound } from '../utils';
import { 
  startTaskProgress, 
  verifyYouTubeTask, 
  verifyTelegramJoin, 
  startWebsiteVisit, 
  completeWebsiteVisit 
} from '../firebase/taskVerificationHooks';
import toast from 'react-hot-toast';

interface EnhancedTaskCardProps {
  task: EnhancedTask;
  userId: string;
  isCompleted: boolean;
  progress?: TaskProgress;
  onTaskComplete: (taskId: string, reward: number) => void;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({ 
  task, 
  userId, 
  isCompleted, 
  progress,
  onTaskComplete 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationKey, setVerificationKey] = useState('');
  const [visitTimer, setVisitTimer] = useState(0);
  const [showKeyInput, setShowKeyInput] = useState(false);

  // Timer for website visit tracking
  useEffect(() => {
    if (progress?.status === 'in_progress' && task.type === 'website' && progress.verificationData?.visitStartTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - progress.verificationData!.visitStartTime!;
        setVisitTimer(Math.floor(elapsed / 1000));
        
        // Auto-complete if minimum time reached
        if (task.minVisitTime && elapsed >= task.minVisitTime * 1000) {
          handleCompleteWebsiteVisit();
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [progress, task]);

  const getTaskIcon = () => {
    switch (task.type) {
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'channel_join': return <MessageCircle className="w-5 h-5" />;
      case 'group_join': return <MessageCircle className="w-5 h-5" />;
      case 'website': return <Link className="w-5 h-5" />;
      case 'ads': return <Play className="w-5 h-5" />;
      default: return <CheckSquare className="w-5 h-5" />;
    }
  };

  const getTaskStatus = () => {
    if (isCompleted) return 'completed';
    if (progress?.status === 'in_progress') return 'in_progress';
    if (progress?.status === 'verification_pending') return 'verification_pending';
    return 'not_started';
  };

  const handleStartTask = async () => {
    if (isProcessing || isCompleted) return;
    
    setIsProcessing(true);
    playSound('click');

    try {
      await startTaskProgress(userId, task.id);
      
      if (task.type === 'website' && task.url) {
        await startWebsiteVisit(userId, task.id, task.url);
      } else if (task.type === 'youtube') {
        setShowKeyInput(true);
        if (task.url) {
          window.open(task.url, '_blank');
        }
      } else if (task.type === 'channel_join' || task.type === 'group_join') {
        if (task.url) {
          window.open(task.url, '_blank');
          // Start verification check after 3 seconds
          setTimeout(() => handleVerifyTelegramJoin(), 3000);
        }
      }
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Failed to start task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyYouTube = async () => {
    if (!verificationKey.trim() || !task.secretKey) return;
    
    setIsProcessing(true);
    
    try {
      const isValid = await verifyYouTubeTask(userId, task.id, verificationKey, task.secretKey);
      
      if (isValid) {
        toast.success('✅ YouTube task verified!');
        onTaskComplete(task.id, task.reward);
        setShowKeyInput(false);
        playSound('success');
      } else {
        toast.error('❌ Invalid key. Please try again.');
        playSound('error');
      }
    } catch (error) {
      console.error('Error verifying YouTube task:', error);
      toast.error('Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyTelegramJoin = async () => {
    if (!task.url) return;
    
    setIsProcessing(true);
    
    try {
      const channelUsername = task.url.split('/').pop() || '';
      const isJoined = await verifyTelegramJoin(userId, task.id, channelUsername);
      
      if (isJoined) {
        toast.success('✅ Telegram join verified!');
        onTaskComplete(task.id, task.reward);
        playSound('success');
      } else {
        toast.error('❌ Please join the channel/group first');
        playSound('error');
      }
    } catch (error) {
      console.error('Error verifying Telegram join:', error);
      toast.error('Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteWebsiteVisit = async () => {
    if (!task.minVisitTime) return;
    
    setIsProcessing(true);
    
    try {
      const isCompleted = await completeWebsiteVisit(userId, task.id, task.minVisitTime);
      
      if (isCompleted) {
        toast.success('✅ Website visit completed!');
        onTaskComplete(task.id, task.reward);
        playSound('success');
      } else {
        toast.error('❌ Please visit the website for longer');
        playSound('error');
      }
    } catch (error) {
      console.error('Error completing website visit:', error);
      toast.error('Verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderActionButton = () => {
    const status = getTaskStatus();
    
    if (status === 'completed') {
      return (
        <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
          <CheckSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Completed</span>
        </div>
      );
    }

    if (status === 'in_progress') {
      if (task.type === 'youtube' && showKeyInput) {
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={verificationKey}
                onChange={(e) => setVerificationKey(e.target.value)}
                placeholder="Enter secret key from video"
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
              />
              <motion.button
                onClick={handleVerifyYouTube}
                disabled={!verificationKey.trim() || isProcessing}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2",
                  verificationKey.trim() && !isProcessing
                    ? "bg-primary-500 text-white hover:bg-primary-600"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                )}
                whileHover={verificationKey.trim() ? { scale: 1.05 } : {}}
                whileTap={verificationKey.trim() ? { scale: 0.95 } : {}}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>Verify</span>
              </motion.button>
            </div>
          </div>
        );
      }

      if (task.type === 'website') {
        const minTime = task.minVisitTime || 30;
        const progress_percent = Math.min((visitTimer / minTime) * 100, 100);
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Visit Progress</span>
              <span className="text-primary-400">{visitTimer}s / {minTime}s</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress_percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            {visitTimer >= minTime && (
              <motion.button
                onClick={handleCompleteWebsiteVisit}
                disabled={isProcessing}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Complete Task
              </motion.button>
            )}
          </div>
        );
      }

      if (task.type === 'channel_join' || task.type === 'group_join') {
        return (
          <motion.button
            onClick={handleVerifyTelegramJoin}
            disabled={isProcessing}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            <span>Verify Join</span>
          </motion.button>
        );
      }

      return (
        <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">In Progress...</span>
        </div>
      );
    }

    // Not started - show Go button
    return (
      <motion.button
        onClick={handleStartTask}
        disabled={isProcessing}
        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-3 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 flex items-center justify-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ExternalLink className="w-4 h-4" />
        )}
        <span>Go</span>
      </motion.button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-panel p-4 transition-all duration-300",
        isCompleted && "border-green-500/40 bg-green-500/5"
      )}
    >
      <div className="flex items-start space-x-4">
        {/* Task Icon */}
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
          isCompleted 
            ? "bg-green-500/20 text-green-400" 
            : "bg-primary-500/20 text-primary-400"
        )}>
          {getTaskIcon()}
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-white mb-1">{task.title}</h4>
              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
              
              {/* Task Type Badge */}
              <div className="flex items-center space-x-2 mb-3">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  task.type === 'youtube' ? "bg-red-500/20 text-red-400" :
                  task.type === 'channel_join' || task.type === 'group_join' ? "bg-blue-500/20 text-blue-400" :
                  task.type === 'website' ? "bg-green-500/20 text-green-400" :
                  task.type === 'ads' ? "bg-purple-500/20 text-purple-400" :
                  "bg-gray-500/20 text-gray-400"
                )}>
                  {task.type.replace('_', ' ').toUpperCase()}
                </span>
                
                {task.verification?.type && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                    {task.verification.verificationMethod.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Reward */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center space-x-1 text-yellow-400 mb-1">
                <div className="coin-icon w-4 h-4" />
                <span className="font-bold">{formatNumber(task.reward)}</span>
              </div>
              <div className="text-xs text-gray-400">Reward</div>
            </div>
          </div>

          {/* Action Button */}
          {renderActionButton()}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedTaskCard;