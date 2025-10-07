import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize app only after Telegram WebApp is ready
const initializeApp = () => {
  console.log('🚀 Telegram WebApp detected, initializing…');
  
  // Hide loading screen
  if (typeof window !== 'undefined' && (window as any).hideLoadingScreen) {
    (window as any).hideLoadingScreen();
  }
  
;
  
  console.log('🎉 App loaded successfully inside Telegram Mini App.');
};

// Check if Telegram WebApp is available and ready
if (typeof window !== 'undefined') {
  if (window.Telegram?.WebApp) {
    // Telegram WebApp is available, wait for ready
    window.Telegram.WebApp.ready(() => {
      initializeApp();
    });
  } else {
    // Fallback for web browsers (no Telegram)
    console.log('🌐 Running in web browser mode, initializing immediately');
    initializeApp();
  }
}