import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import Telegram types
import './utils/telegramPayments'

// Simple initialization - let App.tsx handle the step-by-step process
const initializeReactApp = () => {
  console.log('🚀 Starting React application...');
  
  // Hide HTML loading screen
  if (typeof window !== 'undefined' && (window as any).hideLoadingScreen) {
    (window as any).hideLoadingScreen();
  }
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  console.log('⚛️ React app mounted - App.tsx will handle step-by-step initialization');
};

// Enhanced Telegram WebApp initialization with better timing
if (typeof window !== 'undefined') {
  // Function to initialize with proper timing
  const initWithTiming = () => {
    if (window.Telegram?.WebApp) {
      console.log('📱 Telegram WebApp detected, ensuring proper initialization...');
      
      const webApp = window.Telegram.WebApp;
      
      // Set up WebApp immediately
      webApp.expand();
      webApp.ready(() => {
        console.log('✅ Telegram WebApp ready callback triggered');
        
        // Add a small delay to ensure all Telegram data is available
        setTimeout(() => {
          console.log('🚀 Starting React app after Telegram initialization');
          initializeReactApp();
        }, 100);
      });
      
      // Fallback timeout in case ready() doesn't fire
      setTimeout(() => {
        if (!document.getElementById('root')?.hasChildNodes()) {
          console.log('⏰ Telegram ready timeout, starting app anyway');
          initializeReactApp();
        }
      }, 3000);
      
    } else {
      console.log('🌐 Web browser mode detected, starting immediately');
      initializeReactApp();
    }
  };

  // Check if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithTiming);
  } else {
    // DOM is already ready
    initWithTiming();
  }
}