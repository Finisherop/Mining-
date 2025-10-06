// Task Verification System Types
export interface TaskVerificationConfig {
  type: 'youtube' | 'telegram_channel' | 'telegram_group' | 'website' | 'ads';
  verificationMethod: 'key' | 'bot_check' | 'visit_time' | 'auto';
  config: {
    // YouTube task config
    videoUrl?: string;
    secretKey?: string;
    
    // Telegram task config
    channelUsername?: string;
    groupUsername?: string;
    botToken?: string;
    
    // Website task config
    websiteUrl?: string;
    minVisitTime?: number; // seconds
    
    // Ads task config
    dailyLimit?: number;
    vipUnlimited?: boolean;
  };
}

export interface TaskProgress {
  userId: string;
  taskId: string;
  status: 'not_started' | 'in_progress' | 'verification_pending' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  verificationData?: {
    enteredKey?: string;
    visitStartTime?: number;
    visitDuration?: number;
    telegramJoinStatus?: boolean;
    adsWatched?: number;
  };
}

export interface EnhancedTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'daily' | 'weekly' | 'special' | 'youtube' | 'channel_join' | 'group_join' | 'website' | 'ads';
  completed: boolean;
  progress: number;
  maxProgress: number;
  icon: string;
  url?: string;
  verification?: TaskVerificationConfig;
  active: boolean;
  createdAt: number;
  expiresAt?: number;
  
  // New fields for verification
  verificationStatus?: 'pending' | 'verified' | 'failed';
  secretKey?: string; // For YouTube tasks
  minVisitTime?: number; // For website tasks
  dailyLimit?: number; // For ads tasks
}