import toast from 'react-hot-toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
}

export class AppError extends Error {
  public context: ErrorContext;
  public isRetryable: boolean;
  public severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string,
    context: ErrorContext = {},
    isRetryable = false,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
    this.context = { ...context, timestamp: Date.now() };
    this.isRetryable = isRetryable;
    this.severity = severity;
  }
}

/**
 * Enhanced error handler with user-friendly messages and retry logic
 */
export const handleError = (
  error: Error | AppError,
  context: ErrorContext = {},
  showToast = true
) => {
  const isAppError = error instanceof AppError;
  const errorContext = isAppError ? error.context : context;
  
  // Log error for debugging
  console.error(`[${errorContext.component || 'App'}] Error:`, {
    message: error.message,
    context: errorContext,
    stack: error.stack,
    isRetryable: isAppError ? error.isRetryable : false,
    severity: isAppError ? error.severity : 'medium'
  });

  // Show user-friendly toast message
  if (showToast) {
    const userMessage = getUserFriendlyMessage(error);
    
    if (isAppError && error.severity === 'critical') {
      toast.error(userMessage, { duration: 6000 });
    } else if (isAppError && error.isRetryable) {
      toast.error(`${userMessage} - Please try again`, {
        duration: 5000
      });
    } else {
      toast.error(userMessage, { duration: 4000 });
    }
  }

  // Store error for analytics (could be sent to external service)
  storeErrorForAnalytics(error, errorContext);
};

/**
 * Convert technical errors to user-friendly messages
 */
const getUserFriendlyMessage = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection issue. Please check your internet.';
  }
  
  if (message.includes('firebase') || message.includes('database')) {
    return 'Server connection issue. Trying to reconnect...';
  }
  
  if (message.includes('telegram')) {
    return 'Telegram integration issue. Please restart the app.';
  }
  
  if (message.includes('payment') || message.includes('invoice')) {
    return 'Payment processing issue. Please try again.';
  }
  
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'Access denied. Please check your permissions.';
  }
  
  // Generic fallback
  return 'Something went wrong. Please try again.';
};

/**
 * Store errors for analytics and debugging
 */
const storeErrorForAnalytics = (error: Error, context: ErrorContext) => {
  try {
    const errorLog = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now()
    };
    
    // Store in localStorage for now (could be sent to analytics service)
    const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    existingErrors.push(errorLog);
    
    // Keep only last 50 errors
    if (existingErrors.length > 50) {
      existingErrors.splice(0, existingErrors.length - 50);
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(existingErrors));
  } catch (e) {
    console.warn('Failed to store error log:', e);
  }
};

/**
 * Async error boundary for handling promise rejections
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  asyncFn: T,
  context: ErrorContext = {}
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error; // Re-throw to allow caller to handle if needed
    }
  }) as T;
};

/**
 * Retry wrapper with exponential backoff
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  context: ErrorContext = {}
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        handleError(
          new AppError(
            `Failed after ${maxRetries} attempts: ${lastError.message}`,
            context,
            false,
            'high'
          )
        );
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retry attempt ${attempt}/${maxRetries} in ${delay.toFixed(0)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Debounced error handler to prevent spam
 */
const errorCounts = new Map<string, { count: number; lastSeen: number }>();

export const handleErrorDebounced = (
  error: Error,
  context: ErrorContext = {},
  debounceMs = 5000
) => {
  const errorKey = `${error.name}:${error.message}`;
  const now = Date.now();
  const existing = errorCounts.get(errorKey);
  
  if (existing && now - existing.lastSeen < debounceMs) {
    existing.count++;
    existing.lastSeen = now;
    return; // Skip showing toast for repeated errors
  }
  
  errorCounts.set(errorKey, { count: 1, lastSeen: now });
  handleError(error, context);
  
  // Clean up old entries
  setTimeout(() => {
    for (const [key, value] of errorCounts.entries()) {
      if (now - value.lastSeen > debounceMs * 2) {
        errorCounts.delete(key);
      }
    }
  }, debounceMs * 2);
};