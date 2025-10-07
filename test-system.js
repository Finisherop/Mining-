// FIX: Comprehensive Testing and Debugging Script
// This script tests all major functionality and provides debugging tools

console.log('🧪 Starting comprehensive system test...');

// Test Firebase Connection
async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...');
  
  try {
    if (!window.database) {
      throw new Error('Firebase database not initialized');
    }
    
    // Test basic read operation
    const testRef = window.database.ref('.info/serverTimeOffset');
    const snapshot = await testRef.once('value');
    
    console.log('✅ Firebase connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}

// Test Task Loading
async function testTaskLoading() {
  console.log('📋 Testing task loading...');
  
  try {
    if (!window.database) {
      throw new Error('Firebase database not available');
    }
    
    const tasksRef = window.database.ref('tasks');
    const snapshot = await tasksRef.once('value');
    
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      const taskCount = Object.keys(tasks).length;
      const activeTasks = Object.values(tasks).filter(task => task.active);
      
      console.log(`✅ Task loading test passed - ${taskCount} total tasks, ${activeTasks.length} active`);
      return { total: taskCount, active: activeTasks.length };
    } else {
      console.log('⚠️ No tasks found in database');
      return { total: 0, active: 0 };
    }
  } catch (error) {
    console.error('❌ Task loading test failed:', error);
    return null;
  }
}

// Test User Management
async function testUserManagement() {
  console.log('👤 Testing user management...');
  
  try {
    const testUserId = 'test-user-' + Date.now();
    const testUser = {
      id: testUserId,
      userId: testUserId,
      username: 'Test User',
      coins: 0,
      stars: 0,
      tier: 'free',
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    
    // Create test user
    const userRef = window.database.ref(`users/${testUserId}`);
    await userRef.set(testUser);
    
    // Read back test user
    const snapshot = await userRef.once('value');
    
    if (snapshot.exists() && snapshot.val().username === 'Test User') {
      console.log('✅ User management test passed');
      
      // Clean up test user
      await userRef.remove();
      return true;
    } else {
      throw new Error('User data mismatch');
    }
  } catch (error) {
    console.error('❌ User management test failed:', error);
    return false;
  }
}

// Test Task Completion
async function testTaskCompletion() {
  console.log('✅ Testing task completion...');
  
  try {
    const testUserId = 'test-user-completion-' + Date.now();
    const testTaskId = 'test-task-id';
    
    // Simulate task completion
    const userTaskRef = window.database.ref(`userTasks/${testUserId}/${testTaskId}`);
    await userTaskRef.set({
      completed: true,
      completedAt: Date.now(),
      reward: 100
    });
    
    // Verify completion
    const snapshot = await userTaskRef.once('value');
    
    if (snapshot.exists() && snapshot.val().completed === true) {
      console.log('✅ Task completion test passed');
      
      // Clean up
      await window.database.ref(`userTasks/${testUserId}`).remove();
      return true;
    } else {
      throw new Error('Task completion verification failed');
    }
  } catch (error) {
    console.error('❌ Task completion test failed:', error);
    return false;
  }
}

// Comprehensive System Status Check
async function getSystemStatus() {
  console.log('📊 Checking system status...');
  
  const status = {
    firebase: false,
    tasks: { total: 0, active: 0 },
    users: 0,
    completedTasks: 0,
    errors: []
  };
  
  try {
    // Check Firebase
    status.firebase = await testFirebaseConnection();
    
    // Check Tasks
    const taskResults = await testTaskLoading();
    if (taskResults) {
      status.tasks = taskResults;
    }
    
    // Count users
    try {
      const usersSnapshot = await window.database.ref('users').once('value');
      if (usersSnapshot.exists()) {
        status.users = Object.keys(usersSnapshot.val()).length;
      }
    } catch (error) {
      status.errors.push('Failed to count users: ' + error.message);
    }
    
    // Count completed tasks
    try {
      const userTasksSnapshot = await window.database.ref('userTasks').once('value');
      if (userTasksSnapshot.exists()) {
        const allUserTasks = userTasksSnapshot.val();
        let completedCount = 0;
        Object.values(allUserTasks).forEach(userTasks => {
          Object.values(userTasks).forEach(task => {
            if (task.completed) completedCount++;
          });
        });
        status.completedTasks = completedCount;
      }
    } catch (error) {
      status.errors.push('Failed to count completed tasks: ' + error.message);
    }
    
  } catch (error) {
    status.errors.push('System status check failed: ' + error.message);
  }
  
  return status;
}

// Display System Status
function displaySystemStatus(status) {
  console.log('📊 SYSTEM STATUS REPORT');
  console.log('========================');
  console.log(`🔥 Firebase: ${status.firebase ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`📋 Tasks: ${status.tasks.total} total, ${status.tasks.active} active`);
  console.log(`👤 Users: ${status.users}`);
  console.log(`✅ Completed Tasks: ${status.completedTasks}`);
  
  if (status.errors.length > 0) {
    console.log('❌ Errors:');
    status.errors.forEach(error => console.log(`   - ${error}`));
  } else {
    console.log('✅ No errors detected');
  }
  
  console.log('========================');
}

// Automated Fix Attempts
async function attemptAutomaticFixes() {
  console.log('🔧 Attempting automatic fixes...');
  
  try {
    // Fix 1: Ensure sample tasks exist
    const tasksSnapshot = await window.database.ref('tasks').once('value');
    if (!tasksSnapshot.exists() || Object.keys(tasksSnapshot.val()).length < 3) {
      console.log('🔧 Adding sample tasks...');
      if (window.initializeSampleTasks) {
        await window.initializeSampleTasks();
      }
    }
    
    // Fix 2: Ensure admin user exists
    const adminSnapshot = await window.database.ref('users/123456789').once('value');
    if (!adminSnapshot.exists()) {
      console.log('🔧 Creating admin user...');
      if (window.createAdminUser) {
        await window.createAdminUser();
      }
    }
    
    console.log('✅ Automatic fixes completed');
  } catch (error) {
    console.error('❌ Automatic fixes failed:', error);
  }
}

// Main Test Function
async function runComprehensiveTest() {
  console.log('🚀 Running comprehensive system test...');
  
  // Wait for Firebase to be ready
  let attempts = 0;
  while (!window.database && attempts < 10) {
    console.log('⏳ Waiting for Firebase...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  if (!window.database) {
    console.error('❌ Firebase failed to initialize after 10 seconds');
    return;
  }
  
  // Run tests
  await testFirebaseConnection();
  await testTaskLoading();
  await testUserManagement();
  await testTaskCompletion();
  
  // Get and display status
  const status = await getSystemStatus();
  displaySystemStatus(status);
  
  // Attempt fixes if needed
  if (!status.firebase || status.tasks.active < 3) {
    await attemptAutomaticFixes();
    
    // Re-check status
    const newStatus = await getSystemStatus();
    console.log('\n📊 UPDATED STATUS AFTER FIXES:');
    displaySystemStatus(newStatus);
  }
  
  console.log('🎉 Comprehensive test completed!');
}

// Export functions for manual testing
window.testFirebaseConnection = testFirebaseConnection;
window.testTaskLoading = testTaskLoading;
window.testUserManagement = testUserManagement;
window.testTaskCompletion = testTaskCompletion;
window.getSystemStatus = getSystemStatus;
window.runComprehensiveTest = runComprehensiveTest;

// Auto-run test after initialization
setTimeout(() => {
  if (window.database) {
    runComprehensiveTest();
  } else {
    console.log('⚠️ Firebase not ready, skipping auto-test');
  }
}, 5000);

console.log('🧪 Test system initialized. Run window.runComprehensiveTest() manually if needed.');