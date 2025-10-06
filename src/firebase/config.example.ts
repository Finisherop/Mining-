import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Replace these values with your actual const firebaseConfig = {
  apiKey: "AIzaSyBWhjcgCmp5A6V5uCSSB-j8yMKqRYZuHIY",
  authDomain: "mining-bot-6131b.firebaseapp.com",
  projectId: "mining-bot-6131b",
  storageBucket: "mining-bot-6131b.firebasestorage.app",
  messagingSenderId: "614776449697",
  appId: "1:614776449697:web:a13c41c86b4aa16b2adee0"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;