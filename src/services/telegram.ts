import { TELEGRAM_BOT_API } from '../firebase/config';
import { TelegramWebAppInitData } from '../types/telegram';
// Import Telegram types
import '../utils/telegramPayments';

// Get Telegram WebApp init data with enhanced error handling
export function getTelegramWebAppData(): TelegramWebAppInitData | null {
  if (typeof window === 'undefined') {
    console.log('⚠️ Server-side rendering detected - no Telegram WebApp available');
    return null;
  }
  
  try {
    // Check if running in Telegram WebApp with safe optional chaining
    if (window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Don't call ready() here - it should be called in main.tsx
      if (webApp.initDataUnsafe?.user) {
        console.log('✅ Telegram WebApp user data found:', {
          id: webApp.initDataUnsafe.user.id,
          username: webApp.initDataUnsafe.user.username,
          first_name: webApp.initDataUnsafe.user.first_name
        });
        return {
          user: webApp.initDataUnsafe.user,
          start_param: webApp.initDataUnsafe.start_param,
          auth_date: webApp.initDataUnsafe.auth_date || Date.now(),
          hash: webApp.initDataUnsafe.hash || ''
        };
      } else {
        console.log('⚠️ Telegram WebApp detected but no user data available - may need to wait for initialization');
      }
    }
    
    // FIX: Check URL parameters for external device access
    const urlParams = new URLSearchParams(window.location.search);
    const hasUserParam = urlParams.get('user') === 'true';
    const hasAdminParam = urlParams.get('admin') === 'true';
    const hasDemoParam = urlParams.get('demo');
    
    // FIX: Only return fallback data for development, not for external devices
    if (process.env.NODE_ENV === 'development' && !hasUserParam && !hasAdminParam && !hasDemoParam) {
      console.log('🛠️ Development mode - using fallback Telegram data');
      return {
        user: {
          id: 987654321,
          first_name: 'Dev',
          last_name: 'User',
          username: 'devuser',
          photo_url: '',
          language_code: 'en'
        },
        auth_date: Date.now(),
        hash: 'dev_hash'
      };
    }
    
    // Return null for external devices - let App.tsx handle this
    console.log('🌐 External device detected - no Telegram WebApp data available');
    return null;
  } catch (error) {
    console.error('❌ Error getting Telegram WebApp data:', error);
    return null;
  }
}

// Send Telegram Star invoice
export async function createTelegramStarInvoice(
  _userId: number,
  title: string,
  description: string,
  payload: string,
  starAmount: number
): Promise<{ invoice_link: string } | null> {
  try {
    const response = await fetch(`${TELEGRAM_BOT_API}/createInvoiceLink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        payload,
        provider_token: '', // Empty for Telegram Stars
        currency: 'XTR', // Telegram Stars currency
        prices: [{ label: title, amount: starAmount }],
        max_tip_amount: 0,
        suggested_tip_amounts: [],
        provider_data: JSON.stringify({
          receipt: {
            items: [{
              description: title,
              quantity: '1',
              amount: {
                value: starAmount,
                currency: 'XTR'
              }
            }]
          }
        })
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      return { invoice_link: data.result };
    } else {
      console.error('Telegram API error:', data);
      return null;
    }
  } catch (error) {
    console.error('Error creating Telegram Star invoice:', error);
    return null;
  }
}

// Send message to user
export async function sendTelegramMessage(
  userId: number,
  message: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_BOT_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userId,
        text: message,
        parse_mode: parseMode
      })
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

// Get user profile photos
export async function getTelegramUserPhoto(userId: number): Promise<string | null> {
  try {
    const response = await fetch(`${TELEGRAM_BOT_API}/getUserProfilePhotos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        limit: 1
      })
    });

    const data = await response.json();
    
    if (data.ok && data.result.photos.length > 0) {
      const photo = data.result.photos[0][0]; // Get the smallest size
      const fileResponse = await fetch(`${TELEGRAM_BOT_API}/getFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: photo.file_id
        })
      });

      const fileData = await fileResponse.json();
      if (fileData.ok) {
        return `https://api.telegram.org/file/bot${TELEGRAM_BOT_API.split('/bot')[1]}/${fileData.result.file_path}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting Telegram user photo:', error);
    return null;
  }
}
