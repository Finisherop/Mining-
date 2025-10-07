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

// Initialize React app immediately - let App.tsx handle Telegram WebApp initialization
if (typeof window !== 'undefined') {
  // Wait for Telegram WebApp ready if available, otherwise start immediately
  if (window.Telegram?.WebApp) {
    console.log('📱 Telegram WebApp detected, waiting for ready state...');
    window.Telegram.WebApp.ready(() => {
      console.log('✅ Telegram WebApp is ready');
      initializeReactApp();
    });
  } else {
    console.log('🌐 Web browser mode detected, starting immediately');
    initializeReactApp();
  }
}