// FIX: Sample Tasks and Admin Initialization Script
// This script ensures there are always sample tasks available for testing

const SAMPLE_TASKS = [
  {
    title: "Welcome to Mining PRO",
    description: "Complete your first task to get started! Click 'Claim Reward' to earn your first coins.",
    reward: 100,
    type: "daily",
    icon: "🎯",
    active: true,
    verification: "auto"
  },
  {
    title: "Join Our Telegram Channel",
    description: "Join our official Telegram channel for updates and exclusive content.",
    reward: 250,
    type: "channel_join",
    icon: "📢",
    url: "https://t.me/Mining_tech_bot",
    active: true,
    verification: "manual"
  },
  {
    title: "Follow on YouTube",
    description: "Subscribe to our YouTube channel and ring the notification bell.",
    reward: 300,
    type: "youtube",
    icon: "🎥",
    url: "https://youtube.com/@miningtechbot",
    active: true,
    verification: "manual"
  },
  {
    title: "Daily Login Bonus",
    description: "Login daily to claim your bonus rewards. Streak multiplier applies!",
    reward: 50,
    type: "daily",
    icon: "📅",
    active: true,
    verification: "auto"
  },
  {
    title: "Weekly Mining Challenge",
    description: "Complete 7 days of continuous mining to earn this special reward.",
    reward: 1000,
    type: "weekly",
    icon: "⛏️",
    active: true,
    verification: "auto"
  },
  {
    title: "Special Launch Bonus",
    description: "Limited time offer! Claim your special launch bonus now.",
    reward: 500,
    type: "special",
    icon: "🚀",
    active: true,
    verification: "auto",
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
];

// FIX: Admin Task Management Functions
async function initializeSampleTasks() {
  try {
    console.log('📋 Initializing sample tasks...');
    
    if (!window.database) {
      console.error('Firebase database not available');
      return;
    }

    // Check if tasks already exist
    const tasksRef = window.database.ref('tasks');
    const snapshot = await tasksRef.once('value');
    
    if (snapshot.exists()) {
      const existingTasks = snapshot.val();
      const taskCount = Object.keys(existingTasks).length;
      console.log(`✅ Found ${taskCount} existing tasks`);
      
      if (taskCount >= 3) {
        console.log('📋 Sufficient tasks exist, skipping sample task creation');
        return;
      }
    }

    // Add sample tasks
    console.log('📝 Adding sample tasks...');
    
    for (const task of SAMPLE_TASKS) {
      const newTaskRef = tasksRef.push();
      await newTaskRef.set({
        ...task,
        id: newTaskRef.key,
        createdAt: Date.now()
      });
      console.log(`✅ Added sample task: ${task.title}`);
    }
    
    console.log('🎉 Sample tasks initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize sample tasks:', error);
  }
}

// FIX: Admin User Creation
async function createAdminUser() {
  try {
    const adminUserId = '123456789'; // Admin user ID
    const userRef = window.database.ref(`users/${adminUserId}`);
    
    const adminUser = {
      id: adminUserId,
      userId: adminUserId,
      username: 'Admin',
      coins: 10000,
      stars: 500,
      tier: 'diamond',
      isVIP: true,
      vip_tier: 'diamond',
      vip_expiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
      multiplier: 3,
      withdraw_limit: 10,
      referral_boost: 2,
      dailyWithdrawals: 0,
      referralCode: `https://t.me/Mining_tech_bot?start=ref_${adminUserId}`,
      totalReferrals: 0,
      farmingRate: 50,
      claimStreak: 0,
      claimedDays: [],
      badges: [{
        type: 'diamond',
        name: 'Administrator',
        description: 'System Administrator',
        icon: '👑',
        color: '#00d4ff',
        unlockedAt: Date.now()
      }],
      createdAt: Date.now(),
      lastActive: Date.now(),
      totalEarnings: 0,
      earningMultiplier: 3,
      boosts: 0,
      referralCount: 0,
      vipExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000)
    };
    
    await userRef.set(adminUser);
    console.log('✅ Admin user created successfully');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
  }
}

// FIX: Task Verification Functions
window.verifyTaskCompletion = async function(userId, taskId) {
  try {
    const userTaskRef = window.database.ref(`userTasks/${userId}/${taskId}`);
    const snapshot = await userTaskRef.once('value');
    
    if (snapshot.exists()) {
      const taskData = snapshot.val();
      return taskData.completed === true;
    }
    
    return false;
  } catch (error) {
    console.error('Task verification failed:', error);
    return false;
  }
};

// FIX: Real-time Task Sync
window.syncTasksRealtime = function() {
  if (!window.database) {
    console.error('Database not available for task sync');
    return;
  }

  const tasksRef = window.database.ref('tasks');
  
  tasksRef.on('value', (snapshot) => {
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      const activeTasks = Object.values(tasks).filter(task => task.active);
      
      console.log(`📋 Real-time sync: ${activeTasks.length} active tasks available`);
      
      // Dispatch custom event for React components to listen to
      window.dispatchEvent(new CustomEvent('tasksUpdated', {
        detail: { tasks: activeTasks }
      }));
    }
  });

  console.log('🔄 Real-time task sync enabled');
};

// Auto-initialize when Firebase is ready
function waitForFirebase() {
  if (window.database) {
    console.log('🔥 Firebase ready, initializing admin features...');
    
    // Initialize sample tasks
    setTimeout(initializeSampleTasks, 1000);
    
    // Create admin user
    setTimeout(createAdminUser, 2000);
    
    // Enable real-time sync
    setTimeout(window.syncTasksRealtime, 3000);
  } else {
    console.log('⏳ Waiting for Firebase...');
    setTimeout(waitForFirebase, 500);
  }
}

// Start initialization
waitForFirebase();

// Export functions for manual use
window.initializeSampleTasks = initializeSampleTasks;
window.createAdminUser = createAdminUser;