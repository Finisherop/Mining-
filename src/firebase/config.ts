import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Development configuration - replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  databaseURL: "https://demo-project-default-rtdb.firebaseio.com/",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

let app: FirebaseApp | undefined;
let database: Database | any;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Realtime Database
  database = getDatabase(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.warn('Firebase initialization failed (using demo config):', error);
  
  // Create mock database for development
  database = {
    ref: () => ({
      on: () => {},
      off: () => {},
      get: () => Promise.resolve({ exists: () => false, val: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve()
    })
  };
}

export { database };
export default app;