import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

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
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Telegram Bot Configuration
export const TELEGRAM_BOT_TOKEN = '7795769615:AAH4hhnFG_10vl8tn_dFu8AHdUziQLh6VIA';
export const TELEGRAM_BOT_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export default app;
