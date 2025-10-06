import { TelegramUser } from '../types/firebase';

// Telegram Bot API Key placeholder
export const TELEGRAM_BOT_API_KEY = "YOUR_BOT_API_KEY_HERE";

// Parse URL parameters to detect Telegram user
export const getTelegramUser = (): TelegramUser | null => {
  try {
    // Check if running in Telegram WebApp
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      if (tg.initDataUnsafe?.user) {
        return tg.initDataUnsafe.user;
      }
    }
    
    // Fallback: Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    const username = urlParams.get('username');
    const firstName = urlParams.get('first_name');
    
    if (userId) {
      return {
        id: parseInt(userId),
        first_name: firstName || 'User',
        username: username || undefined,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Telegram user:', error);
    return null;
  }
};

// Check if user is accessing via Telegram
export const isTelegramUser = (): boolean => {
  return getTelegramUser() !== null;
};

// Initialize Telegram WebApp if available
export const initTelegramWebApp = (): void => {
  try {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Set theme
      tg.setHeaderColor('#0b0f1a');
      tg.setBackgroundColor('#0b0f1a');
    }
  } catch (error) {
    console.error('Error initializing Telegram WebApp:', error);
  }
};

// Show Telegram alert
export const showTelegramAlert = (message: string): void => {
  try {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.showAlert(message);
    } else {
      alert(message);
    }
  } catch (error) {
    console.error('Error showing Telegram alert:', error);
    alert(message);
  }
};

// Show Telegram confirm
export const showTelegramConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        (window as any).Telegram.WebApp.showConfirm(message, resolve);
      } else {
        resolve(confirm(message));
      }
    } catch (error) {
      console.error('Error showing Telegram confirm:', error);
      resolve(confirm(message));
    }
  });
};

// Haptic feedback
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light'): void => {
  try {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      const haptic = (window as any).Telegram.WebApp.HapticFeedback;
      
      switch (type) {
        case 'success':
          haptic.notificationOccurred('success');
          break;
        case 'warning':
          haptic.notificationOccurred('warning');
          break;
        case 'error':
          haptic.notificationOccurred('error');
          break;
        default:
          haptic.impactOccurred(type);
      }
    } else {
      // Fallback to browser vibration
      if (navigator.vibrate) {
        const patterns = {
          light: 50,
          medium: 100,
          heavy: 200,
          success: [100, 50, 100],
          warning: [200, 100, 200],
          error: [300]
        };
        navigator.vibrate(patterns[type]);
      }
    }
  } catch (error) {
    console.error('Error with haptic feedback:', error);
  }
};