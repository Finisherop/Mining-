/**
 * Step-by-step initialization manager for Telegram WebApp
 * Prevents race conditions and ensures smooth loading
 */

export interface InitializationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  error?: string;
}

export interface InitializationState {
  currentStep: number;
  steps: InitializationStep[];
  isComplete: boolean;
  hasError: boolean;
}

export type InitializationCallback = (state: InitializationState) => void;

export class InitializationManager {
  private state: InitializationState;
  private callbacks: InitializationCallback[] = [];

  constructor() {
    this.state = {
      currentStep: 0,
      isComplete: false,
      hasError: false,
      steps: [
        {
          id: 'telegram-context',
          name: 'Telegram WebApp',
          description: 'Initializing Telegram WebApp context and theme',
          status: 'pending'
        },
        {
          id: 'telegram-data',
          name: 'User Data',
          description: 'Retrieving Telegram user information',
          status: 'pending'
        },
        {
          id: 'firebase-auth',
          name: 'Database Connection',
          description: 'Connecting to Firebase database',
          status: 'pending'
        },
        {
          id: 'user-profile',
          name: 'User Profile',
          description: 'Loading user profile and settings',
          status: 'pending'
        },
        {
          id: 'ui-render',
          name: 'Interface',
          description: 'Rendering user interface',
          status: 'pending'
        },
        {
          id: 'data-fetch',
          name: 'Content Loading',
          description: 'Loading tasks, rewards, and other data',
          status: 'pending'
        }
      ]
    };
  }

  // Subscribe to state changes
  subscribe(callback: InitializationCallback): () => void {
    this.callbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Notify all subscribers
  private notify(): void {
    this.callbacks.forEach(callback => callback(this.state));
  }

  // Get current state
  getState(): InitializationState {
    return { ...this.state };
  }

  // Start initialization process
  async initialize(): Promise<void> {
    console.log('🚀 Starting step-by-step initialization...');
    
    try {
      // Step 1: Initialize Telegram WebApp context
      await this.executeStep(0, () => this.initializeTelegramContext());
      
      // Step 2: Wait for Telegram data
      await this.executeStep(1, () => this.waitForTelegramData());
      
      // Step 3: Initialize Firebase
      await this.executeStep(2, () => this.initializeFirebase());
      
      // Step 4: Load user profile
      await this.executeStep(3, () => this.loadUserProfile());
      
      // Step 5: Render UI (this will be handled by React)
      await this.executeStep(4, () => this.prepareUIRender());
      
      // Step 6: Fetch additional data (this will be handled after UI is visible)
      await this.executeStep(5, () => this.prepareDataFetch());
      
      this.state.isComplete = true;
      console.log('✅ All initialization steps completed successfully');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.state.hasError = true;
      this.state.steps[this.state.currentStep].status = 'failed';
      this.state.steps[this.state.currentStep].error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    this.notify();
  }

  // Execute a single step
  private async executeStep(stepIndex: number, stepFunction: () => Promise<void>): Promise<void> {
    this.state.currentStep = stepIndex;
    this.state.steps[stepIndex].status = 'loading';
    this.notify();
    
    console.log(`🔄 Step ${stepIndex + 1}: ${this.state.steps[stepIndex].name}`);
    
    try {
      await stepFunction();
      this.state.steps[stepIndex].status = 'completed';
      console.log(`✅ Step ${stepIndex + 1} completed: ${this.state.steps[stepIndex].name}`);
    } catch (error) {
      this.state.steps[stepIndex].status = 'failed';
      this.state.steps[stepIndex].error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
    
    this.notify();
  }

  // Step 1: Initialize Telegram WebApp context
  private async initializeTelegramContext(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          // Set up theme and expand
          tg.expand();
          
          // Set theme colors
          if (tg.setHeaderColor) {
            tg.setHeaderColor('#0b0f1a');
          }
          if (tg.setBackgroundColor) {
            tg.setBackgroundColor('#0b0f1a');
          }
          
          // Enable haptic feedback
          if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
          }
          
          console.log('📱 Telegram WebApp context initialized');
          (window as any).telegramContextReady = true;
          resolve();
        } else {
          console.log('🌐 No Telegram WebApp detected, using web browser mode');
          (window as any).telegramContextReady = false;
          resolve();
        }
      } catch (error) {
        console.error('❌ Failed to initialize Telegram context:', error);
        reject(error);
      }
    });
  }

  // Step 2: Wait for Telegram data
  private async waitForTelegramData(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('📱 Waiting for Telegram WebApp data...');
      
      // Check URL parameters for external access first
      const urlParams = new URLSearchParams(window.location.search);
      const hasExternalAccess = urlParams.get('user') || urlParams.get('admin') || urlParams.get('demo');
      
      if (hasExternalAccess) {
        console.log('🌐 External access detected, skipping Telegram data');
        (window as any).telegramDataReady = false;
        resolve();
        return;
      }

      // Function to check for Telegram data
      const checkTelegramData = () => {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
          console.log('👤 Telegram user data found:', {
            id: window.Telegram.WebApp.initDataUnsafe.user.id,
            username: window.Telegram.WebApp.initDataUnsafe.user.username,
            first_name: window.Telegram.WebApp.initDataUnsafe.user.first_name,
            last_name: window.Telegram.WebApp.initDataUnsafe.user.last_name
          });
          (window as any).telegramDataReady = true;
          return true;
        }
        return false;
      };

      // Check immediately
      if (checkTelegramData()) {
        resolve();
        return;
      }

      // If no data yet, poll for it with increasing intervals
      let attempts = 0;
      const maxAttempts = 10;
      const baseDelay = 500; // Start with 500ms

      const pollForData = () => {
        attempts++;
        console.log(`📱 Polling for Telegram data (attempt ${attempts}/${maxAttempts})`);
        
        if (checkTelegramData()) {
          resolve();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log('⏰ Telegram data timeout after maximum attempts, continuing without Telegram data');
          (window as any).telegramDataReady = false;
          resolve();
          return;
        }
        
        // Exponential backoff: 500ms, 750ms, 1000ms, 1250ms, etc.
        const delay = baseDelay + (attempts * 250);
        setTimeout(pollForData, delay);
      };

      // Start polling after initial delay
      setTimeout(pollForData, baseDelay);
    });
  }

  // Step 3: Initialize Firebase
  private async initializeFirebase(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔥 Initializing Firebase connection...');
      
      // Check if Firebase is already connected
      if ((window as any).firebaseConnected === true) {
        console.log('✅ Firebase already connected');
        resolve();
        return;
      }

      // Test Firebase connection with retry logic
      const testFirebaseConnection = async (attempt = 1, maxAttempts = 3) => {
        try {
          console.log(`🔥 Testing Firebase connection (attempt ${attempt}/${maxAttempts})`);
          
          // Check if Firebase app and database are available
          if (!(window as any).firebaseApp || !(window as any).database) {
            throw new Error('Firebase app or database not initialized');
          }

          // Test a simple read operation
          const testRef = (window as any).firebaseRef((window as any).database, '.info/connected');
          const snapshot = await (window as any).firebaseGet(testRef);
          
          if (snapshot.exists() && snapshot.val() === true) {
            console.log('✅ Firebase connection test successful');
            (window as any).firebaseConnected = true;
            resolve();
            return;
          }
          
          // If not connected, wait and retry
          if (attempt < maxAttempts) {
            console.log(`⏳ Firebase not ready, retrying in ${attempt * 1000}ms...`);
            setTimeout(() => testFirebaseConnection(attempt + 1, maxAttempts), attempt * 1000);
          } else {
            console.log('⚠️ Firebase connection failed after all attempts, continuing with offline mode');
            (window as any).firebaseConnected = 'timeout';
            resolve();
          }
        } catch (error) {
          console.error(`❌ Firebase connection test failed (attempt ${attempt}):`, error);
          
          if (attempt < maxAttempts) {
            setTimeout(() => testFirebaseConnection(attempt + 1, maxAttempts), attempt * 1000);
          } else {
            console.log('⚠️ Firebase initialization failed completely, continuing with offline mode');
            (window as any).firebaseConnected = 'error';
            resolve(); // Don't reject, continue with offline mode
          }
        }
      };

      // Listen for Firebase ready event (from HTML initialization)
      const handleFirebaseReady = () => {
        console.log('🔥 Firebase ready event received');
        (window as any).firebaseConnected = true;
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        resolve();
      };

      window.addEventListener('firebaseReady', handleFirebaseReady);

      // Start connection test after a short delay to allow HTML Firebase init
      setTimeout(() => {
        if ((window as any).firebaseConnected !== true) {
          testFirebaseConnection();
        }
      }, 1000);

      // Absolute timeout as fallback
      setTimeout(() => {
        if ((window as any).firebaseConnected !== true) {
          console.log('⏰ Firebase absolute timeout, continuing with offline mode');
          window.removeEventListener('firebaseReady', handleFirebaseReady);
          (window as any).firebaseConnected = 'timeout';
          resolve();
        }
      }, 15000); // 15 second absolute timeout
    });
  }

  // Step 4: Load user profile
  private async loadUserProfile(): Promise<void> {
    return new Promise((resolve) => {
      // This step will be handled by React hooks
      // We just mark it as ready for the next step
      console.log('👤 User profile loading prepared');
      (window as any).userProfileReady = true;
      resolve();
    });
  }

  // Step 5: Prepare UI render
  private async prepareUIRender(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🎨 UI rendering prepared');
      (window as any).uiRenderReady = true;
      resolve();
    });
  }

  // Step 6: Prepare data fetch
  private async prepareDataFetch(): Promise<void> {
    return new Promise((resolve) => {
      console.log('📊 Data fetching prepared');
      (window as any).dataFetchReady = true;
      resolve();
    });
  }

  // Reset initialization state
  reset(): void {
    this.state = {
      currentStep: 0,
      isComplete: false,
      hasError: false,
      steps: this.state.steps.map(step => ({
        ...step,
        status: 'pending',
        error: undefined
      }))
    };
    this.notify();
  }

  // Skip to a specific step (for testing or recovery)
  skipToStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.state.steps.length) {
      this.state.currentStep = stepIndex;
      // Mark previous steps as completed
      for (let i = 0; i < stepIndex; i++) {
        this.state.steps[i].status = 'completed';
      }
      this.notify();
    }
  }
}

// Global instance
export const initManager = new InitializationManager();