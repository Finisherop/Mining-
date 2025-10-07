/**
 * SIMPLIFIED MAIN ENTRY POINT
 * 
 * Removes complex initialization logic and renders app immediately
 * Telegram WebApp integration happens seamlessly without blocking
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './utils/telegramPayments';

// Simple, immediate initialization
const initializeApp = () => {
  console.log('🚀 Simplified App: Starting immediately');
  
  // Hide HTML loading screen if present
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
  
  // Render React app immediately
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ Simplified App: Rendered successfully');
};

// Enhanced Telegram WebApp setup (non-blocking)
if (typeof window !== 'undefined') {
  // Set up Telegram WebApp if available
  if (window.Telegram?.WebApp) {
    console.log('📱 Telegram WebApp detected - setting up');
    
    const webApp = window.Telegram.WebApp;
    
    // Configure WebApp immediately
    webApp.expand();
    webApp.ready(() => {
      console.log('📱 Telegram WebApp ready');
      
      // Set theme colors
      if (webApp.setHeaderColor) webApp.setHeaderColor('#0b0f1a');
      if (webApp.setBackgroundColor) webApp.setBackgroundColor('#0b0f1a');
      
      // Enable haptic feedback
      if (webApp.HapticFeedback) {
        webApp.HapticFeedback.impactOccurred('light');
      }
    });
  }
  
  // Initialize app immediately - don't wait for Telegram
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}