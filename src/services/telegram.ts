import { TELEGRAM_BOT_API } from '../firebase/config';
import { TelegramWebAppInitData } from '../types/telegram';

// Get Telegram WebApp init data
export function getTelegramWebAppData(): TelegramWebAppInitData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Check if running in Telegram WebApp
    if ((window as any).Telegram?.WebApp) {
      const webApp = (window as any).Telegram.WebApp;
      webApp.ready();
      
      if (webApp.initDataUnsafe?.user) {
        return {
          user: webApp.initDataUnsafe.user,
          start_param: webApp.initDataUnsafe.start_param,
          auth_date: webApp.initDataUnsafe.auth_date || Date.now(),
          hash: webApp.initDataUnsafe.hash || ''
        };
      }
    }
    
    // Fallback for development/testing
    return {
      user: {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        photo_url: '',
        language_code: 'en'
      },
      auth_date: Date.now(),
      hash: 'dev_hash'
    };
  } catch (error) {
    console.error('Error getting Telegram WebApp data:', error);
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
