import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-EiTLr-bDDDKgR5tvzguyNfdlKDO8Rw8",
  authDomain: "tap-and-earn-d3583.firebaseapp.com",
  databaseURL: "https://tap-and-earn-d3583-default-rtdb.firebaseio.com/",
  projectId: "tap-and-earn-d3583",
  storageBucket: "tap-and-earn-d3583.firebasestorage.app",
  messagingSenderId: "759083332180",
  appId: "1:759083332180:web:165eb0bf070956fb0033c1"
};

let app: FirebaseApp | undefined;
let database: Database | any;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  
  // Initialize Realtime Database
  database = getDatabase(app);
  
  console.log('🔥 Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  
  // Create mock database for development fallback
  database = {
    ref: () => ({
      on: () => {},
      off: () => {},
      get: () => Promise.resolve({ exists: () => false, val: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve()
    })
  };
  
  console.warn('⚠️ Using mock database - check Firebase configuration');
}

export { database };
export default app;