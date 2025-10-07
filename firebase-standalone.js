// FIX: Standalone Firebase Configuration and Task Management
// This file ensures Firebase is properly initialized and tasks are accessible

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getDatabase, ref, set, get, onValue, off, push, update } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-EiTLr-bDDDKgR5tvzguyNfdlKDO8Rw8",
  authDomain: "tap-and-earn-d3583.firebaseapp.com",
  databaseURL: "https://tap-and-earn-d3583-default-rtdb.firebaseio.com",
  projectId: "tap-and-earn-d3583",
  storageBucket: "tap-and-earn-d3583.firebasestorage.app",
  messagingSenderId: "759083332180",
  appId: "1:759083332180:web:165eb0bf070956fb0033c1"
};

// Initialize Firebase
let app, database;

try {
  console.log('🔥 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  
  // Test connection
  const connectedRef = ref(database, '.info/connected');
  onValue(connectedRef, (snapshot) => {
    if (snapshot.val() === true) {
      console.log('✅ Firebase connected successfully');
    } else {
      console.log('❌ Firebase disconnected');
    }
  });
  
  console.log('🎯 Firebase initialization complete');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

// Export Firebase instance for global access
window.firebaseApp = app;
window.database = database;

// FIX: Task Management Functions
class TaskManager {
  constructor() {
    this.tasks = [];
    this.loading = true;
    this.error = null;
    this.listeners = [];
  }

  // Initialize task loading
  async init() {
    try {
      console.log('📋 Initializing Task Manager...');
      
      const tasksRef = ref(database, 'tasks');
      
      // Listen for task changes
      const unsubscribe = onValue(tasksRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const tasksData = snapshot.val();
            this.tasks = Object.keys(tasksData).map(key => ({
              ...tasksData[key],
              id: key
            }));
            console.log('📝 Tasks loaded from Firebase:', this.tasks.length);
          } else {
            this.tasks = [];
            console.log('📝 No tasks found in Firebase');
          }
          
          this.loading = false;
          this.error = null;
          this.notifyListeners();
        } catch (err) {
          console.error('Error processing tasks:', err);
          this.error = err.message;
          this.loading = false;
          this.notifyListeners();
        }
      }, (err) => {
        console.error('Firebase tasks listener error:', err);
        this.error = err.message;
        this.loading = false;
        this.notifyListeners();
      });

      return unsubscribe;
    } catch (error) {
      console.error('Task manager initialization failed:', error);
      this.error = error.message;
      this.loading = false;
    }
  }

  // Add task listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove task listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          tasks: this.tasks,
          loading: this.loading,
          error: this.error
        });
      } catch (err) {
        console.error('Task listener error:', err);
      }
    });
  }

  // Get active tasks
  getActiveTasks() {
    return this.tasks.filter(task => task.active);
  }

  // Add new task (Admin function)
  async addTask(task) {
    try {
      const tasksRef = ref(database, 'tasks');
      const newTaskRef = push(tasksRef);
      
      const newTask = {
        ...task,
        id: newTaskRef.key,
        createdAt: Date.now(),
        active: true
      };
      
      await set(newTaskRef, newTask);
      console.log('✅ Task added successfully:', newTask.title);
      return newTaskRef.key;
    } catch (error) {
      console.error('❌ Failed to add task:', error);
      throw error;
    }
  }

  // Update task (Admin function)
  async updateTask(taskId, updates) {
    try {
      const taskRef = ref(database, `tasks/${taskId}`);
      await update(taskRef, updates);
      console.log('✅ Task updated successfully:', taskId);
      return true;
    } catch (error) {
      console.error('❌ Failed to update task:', error);
      throw error;
    }
  }

  // Delete task (Admin function)
  async deleteTask(taskId) {
    try {
      const taskRef = ref(database, `tasks/${taskId}`);
      await set(taskRef, null);
      console.log('✅ Task deleted successfully:', taskId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete task:', error);
      throw error;
    }
  }
}

// FIX: User Task Completion Manager
class UserTaskManager {
  constructor(userId) {
    this.userId = userId;
    this.completedTasks = [];
    this.loading = true;
    this.error = null;
  }

  // Initialize user task tracking
  async init() {
    if (!this.userId) {
      this.loading = false;
      return;
    }

    try {
      console.log('👤 Initializing User Task Manager for:', this.userId);
      
      const userTasksRef = ref(database, `userTasks/${this.userId}`);
      
      const unsubscribe = onValue(userTasksRef, (snapshot) => {
        try {
          if (snapshot.exists()) {
            const tasksData = snapshot.val();
            this.completedTasks = Object.keys(tasksData).filter(taskId => tasksData[taskId].completed);
            console.log('✅ User completed tasks loaded:', this.completedTasks.length);
          } else {
            this.completedTasks = [];
          }
          
          this.loading = false;
          this.error = null;
        } catch (err) {
          console.error('Error processing user tasks:', err);
          this.error = err.message;
          this.loading = false;
        }
      }, (err) => {
        console.error('User tasks listener error:', err);
        this.error = err.message;
        this.loading = false;
      });

      return unsubscribe;
    } catch (error) {
      console.error('User task manager initialization failed:', error);
      this.error = error.message;
      this.loading = false;
    }
  }

  // Complete a task
  async completeTask(taskId, reward) {
    try {
      const userTaskRef = ref(database, `userTasks/${this.userId}/${taskId}`);
      await set(userTaskRef, {
        completed: true,
        completedAt: Date.now(),
        reward
      });
      console.log('✅ Task completed successfully:', taskId);
      return true;
    } catch (error) {
      console.error('❌ Failed to complete task:', error);
      throw error;
    }
  }
}

// Initialize global task managers
const globalTaskManager = new TaskManager();
let globalUserTaskManager = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Starting Firebase Task System...');
  
  try {
    // Initialize task manager
    await globalTaskManager.init();
    
    // Export to global scope for React app to use
    window.TaskManager = TaskManager;
    window.UserTaskManager = UserTaskManager;
    window.globalTaskManager = globalTaskManager;
    
    console.log('✅ Firebase Task System initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Task System initialization failed:', error);
  }
});

export { app, database, TaskManager, UserTaskManager, globalTaskManager };