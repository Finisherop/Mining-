// Task Verification Firebase Hooks
import { useState, useEffect } from 'react';
import { ref, get, set, onValue, off, update } from 'firebase/database';
import { database } from './config';
import { TaskProgress } from '../types/taskVerification';

// Hook for task progress tracking
export const useTaskProgress = (userId: string) => {
  const [progress, setProgress] = useState<Record<string, TaskProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const progressRef = ref(database, `taskProgress/${userId}`);
    
    const unsubscribe = onValue(progressRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          setProgress(snapshot.val());
        } else {
          setProgress({});
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(progressRef, 'value', unsubscribe);
  }, [userId]);

  return { progress, loading, error };
};

// Start task progress
export const startTaskProgress = async (userId: string, taskId: string): Promise<boolean> => {
  try {
    const progressRef = ref(database, `taskProgress/${userId}/${taskId}`);
    
    const taskProgress: TaskProgress = {
      userId,
      taskId,
      status: 'in_progress',
      startedAt: Date.now(),
      verificationData: {}
    };
    
    await set(progressRef, taskProgress);
    console.log('✅ Task progress started:', taskId);
    return true;
  } catch (error) {
    console.error('❌ Error starting task progress:', error);
    return false;
  }
};

// Update task progress with verification data
export const updateTaskProgress = async (
  userId: string, 
  taskId: string, 
  updates: Partial<TaskProgress>
): Promise<boolean> => {
  try {
    const progressRef = ref(database, `taskProgress/${userId}/${taskId}`);
    
    await update(progressRef, {
      ...updates,
      completedAt: updates.status === 'completed' ? Date.now() : undefined
    });
    
    console.log('✅ Task progress updated:', taskId);
    return true;
  } catch (error) {
    console.error('❌ Error updating task progress:', error);
    return false;
  }
};

// Verify YouTube task with secret key
export const verifyYouTubeTask = async (
  userId: string,
  taskId: string,
  enteredKey: string,
  correctKey: string
): Promise<boolean> => {
  try {
    const isCorrect = enteredKey.trim().toLowerCase() === correctKey.trim().toLowerCase();
    
    await updateTaskProgress(userId, taskId, {
      status: isCorrect ? 'completed' : 'failed',
      verificationData: {
        enteredKey: enteredKey.trim()
      }
    });
    
    return isCorrect;
  } catch (error) {
    console.error('❌ Error verifying YouTube task:', error);
    return false;
  }
};

// Verify Telegram join (placeholder - would need bot integration)
export const verifyTelegramJoin = async (
  userId: string,
  taskId: string,
  channelUsername: string
): Promise<boolean> => {
  try {
    // This would require actual Telegram Bot API integration
    // For now, we'll simulate the verification
    console.log('🔄 Verifying Telegram join for:', channelUsername);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For demo purposes, randomly succeed/fail
    const isJoined = Math.random() > 0.3; // 70% success rate
    
    await updateTaskProgress(userId, taskId, {
      status: isJoined ? 'completed' : 'failed',
      verificationData: {
        telegramJoinStatus: isJoined
      }
    });
    
    return isJoined;
  } catch (error) {
    console.error('❌ Error verifying Telegram join:', error);
    return false;
  }
};

// Start website visit tracking
export const startWebsiteVisit = async (
  userId: string,
  taskId: string,
  websiteUrl: string
): Promise<boolean> => {
  try {
    await updateTaskProgress(userId, taskId, {
      status: 'in_progress',
      verificationData: {
        visitStartTime: Date.now()
      }
    });
    
    // Open website in new tab
    window.open(websiteUrl, '_blank');
    
    console.log('✅ Website visit started:', websiteUrl);
    return true;
  } catch (error) {
    console.error('❌ Error starting website visit:', error);
    return false;
  }
};

// Complete website visit verification
export const completeWebsiteVisit = async (
  userId: string,
  taskId: string,
  minVisitTime: number
): Promise<boolean> => {
  try {
    const progressRef = ref(database, `taskProgress/${userId}/${taskId}`);
    const snapshot = await get(progressRef);
    
    if (!snapshot.exists()) {
      throw new Error('Task progress not found');
    }
    
    const progress = snapshot.val() as TaskProgress;
    const visitStartTime = progress.verificationData?.visitStartTime;
    
    if (!visitStartTime) {
      throw new Error('Visit start time not found');
    }
    
    const visitDuration = Date.now() - visitStartTime;
    const requiredTime = minVisitTime * 1000; // Convert to milliseconds
    const isCompleted = visitDuration >= requiredTime;
    
    await updateTaskProgress(userId, taskId, {
      status: isCompleted ? 'completed' : 'failed',
      verificationData: {
        ...progress.verificationData,
        visitDuration
      }
    });
    
    return isCompleted;
  } catch (error) {
    console.error('❌ Error completing website visit:', error);
    return false;
  }
};

// Track ads watching
export const trackAdsWatching = async (
  userId: string,
  adsWatched: number
): Promise<boolean> => {
  try {
    const adsRef = ref(database, `adsProgress/${userId}`);
    const today = new Date().toDateString();
    
    await set(adsRef, {
      date: today,
      adsWatched,
      lastUpdated: Date.now()
    });
    
    console.log('✅ Ads progress tracked:', adsWatched);
    return true;
  } catch (error) {
    console.error('❌ Error tracking ads:', error);
    return false;
  }
};

// Get today's ads progress
export const getTodaysAdsProgress = async (userId: string): Promise<number> => {
  try {
    const adsRef = ref(database, `adsProgress/${userId}`);
    const snapshot = await get(adsRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const data = snapshot.val();
    const today = new Date().toDateString();
    
    if (data.date === today) {
      return data.adsWatched || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('❌ Error getting ads progress:', error);
    return 0;
  }
};