import { UserTier } from '../types';
import { TelegramUser, TelegramWebAppInitData } from '../types/telegram';

// Telegram WebApp payment utilities
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        // Payment methods
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        
        // UI methods
        showAlert: (message: string) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        
        // Haptic feedback
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
        
        // Initialization methods
        ready: (callback?: () => void) => void;
        expand: () => void;
        
        // Theme methods
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        
        // Data properties
        initData?: string;
        initDataUnsafe?: TelegramWebAppInitData & {
          user?: TelegramUser;
          start_param?: string;
          auth_date?: number;
          hash?: string;
        };
        
        // Version and platform info
        version?: string;
        platform?: string;
        colorScheme?: 'light' | 'dark';
        
        // Viewport info
        viewportHeight?: number;
        viewportStableHeight?: number;
        isExpanded?: boolean;
      };
    };
  }
}

export interface PaymentResult {
  success: boolean;
  invoiceId?: string;
  error?: string;
}

/**
 * Create Telegram Stars invoice for VIP tier purchase
 */
export const createStarInvoice = async (
  userId: string,
  _tier: UserTier,
  _starAmount: number
): Promise<PaymentResult> => {
  try {
    // In a real implementation, this would call your backend API
    // to create a Telegram invoice via Bot API

    // Generate invoice ID (in production, this comes from Telegram)
    const invoiceId = `inv_${Date.now()}_${userId}`;
    
    return {
      success: true,
      invoiceId,
    };
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return {
      success: false,
      error: 'Failed to create payment invoice'
    };
  }
};

/**
 * Open Telegram Stars payment invoice
 */
export const openTelegramInvoice = (
  invoiceUrl: string,
  onPaymentComplete: (success: boolean, invoiceId?: string) => void
): void => {
  if (!window.Telegram?.WebApp?.openInvoice) {
    console.error('Telegram WebApp not available');
    onPaymentComplete(false);
    return;
  }

  window.Telegram.WebApp.openInvoice(invoiceUrl, (status: string) => {
    console.log('Payment status:', status);
    
    switch (status) {
      case 'paid':
        onPaymentComplete(true, extractInvoiceId(invoiceUrl));
        break;
      case 'cancelled':
      case 'failed':
        onPaymentComplete(false);
        break;
      default:
        console.warn('Unknown payment status:', status);
        onPaymentComplete(false);
    }
  });
};

/**
 * Extract invoice ID from invoice URL
 */
const extractInvoiceId = (invoiceUrl: string): string => {
  const matches = invoiceUrl.match(/invoice\/(.+)$/);
  return matches ? matches[1] : '';
};

/**
 * Verify payment with backend (mock implementation)
 */
export const verifyPayment = async (invoiceId: string): Promise<boolean> => {
  try {
    // In production, this would verify the payment with Telegram
    // and your backend database
    console.log('Verifying payment for invoice:', invoiceId);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful verification (90% success rate for demo)
    return Math.random() > 0.1;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
};

/**
 * Handle VIP tier purchase flow
 */
export const purchaseVIPTier = async (
  userId: string,
  tier: UserTier,
  starAmount: number,
  onSuccess: (tier: UserTier) => void,
  onError: (error: string) => void,
  onProgress: (stage: string) => void
): Promise<void> => {
  try {
    onProgress('Creating invoice...');
    
    // Step 1: Create invoice
    const invoiceResult = await createStarInvoice(userId, tier, starAmount);
    if (!invoiceResult.success || !invoiceResult.invoiceId) {
      throw new Error(invoiceResult.error || 'Failed to create invoice');
    }

    onProgress('Opening payment...');
    
    // Step 2: Open payment interface
    const invoiceUrl = `https://t.me/invoice/${invoiceResult.invoiceId}`;
    
    openTelegramInvoice(invoiceUrl, async (paymentSuccess, invoiceId) => {
      if (!paymentSuccess) {
        onError('Payment was cancelled or failed');
        return;
      }

      onProgress('Verifying payment...');
      
    // Step 3: Verify payment
    const verified = await verifyPayment(invoiceId || invoiceResult.invoiceId!);
      if (!verified) {
        onError('Payment verification failed');
        return;
      }

      onProgress('Activating VIP...');
      
      // Step 4: Success
      onSuccess(tier);
    });
    
  } catch (error) {
    console.error('VIP purchase failed:', error);
    onError(error instanceof Error ? error.message : 'Purchase failed');
  }
};

/**
 * Show Telegram alert with haptic feedback
 */
export const showPaymentAlert = (message: string, type: 'success' | 'error' | 'warning' = 'success'): void => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message);
    window.Telegram.WebApp.HapticFeedback?.notificationOccurred(type);
  } else {
    alert(message);
  }
};

/**
 * Show payment confirmation dialog
 */
export const showPaymentConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  if (window.Telegram?.WebApp?.showConfirm) {
    window.Telegram.WebApp.showConfirm(message, (confirmed) => {
      if (confirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    });
  } else {
    if (confirm(message)) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  }
};

/**
 * Trigger haptic feedback for payment actions
 */
export const paymentHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium'): void => {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
  }
};