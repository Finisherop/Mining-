import { useState, useEffect, useRef } from 'react';

interface UseSmoothCounterOptions {
  duration?: number;
  precision?: number;
  onComplete?: () => void;
}

/**
 * Custom hook for smooth number transitions without flashing
 */
export const useSmoothCounter = (
  targetValue: number,
  options: UseSmoothCounterOptions = {}
) => {
  const { duration = 800, precision = 0, onComplete } = options;
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(targetValue);

  useEffect(() => {
    // Don't animate if the difference is too small
    const difference = Math.abs(targetValue - displayValue);
    if (difference < Math.pow(10, -precision)) {
      return;
    }

    setIsAnimating(true);
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentValue = startValueRef.current + 
        (targetValue - startValueRef.current) * easeOutQuart;

      setDisplayValue(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        setIsAnimating(false);
        onComplete?.();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetValue, duration, precision, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    value: displayValue,
    isAnimating,
    setInstantValue: (value: number) => {
      setDisplayValue(value);
      startValueRef.current = value;
    }
  };
};

/**
 * Hook for managing cached data with background refresh
 */
export const useCachedData = function<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    cacheTime?: number;
    staleTime?: number;
    backgroundRefresh?: boolean;
  } = {}
) {
  const { cacheTime = 5 * 60 * 1000, staleTime = 30 * 1000, backgroundRefresh = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const cacheRef = useRef<{
    data: T;
    timestamp: number;
  } | null>(null);

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setIsLoading(true);
      }
      setError(null);
      
      const result = await fetchFn();
      const now = Date.now();
      
      cacheRef.current = { data: result, timestamp: now };
      setData(result);
      setIsStale(false);
      
      // Cache to localStorage
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: result,
        timestamp: now
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to load from cache first
    const cached = localStorage.getItem(`cache_${key}`);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < cacheTime) {
          setData(cachedData);
          setIsLoading(false);
          setIsStale(age > staleTime);
          cacheRef.current = { data: cachedData, timestamp };
          
          // If stale but within cache time, fetch in background
          if (age > staleTime && backgroundRefresh) {
            fetchData(true);
          }
          return;
        }
      } catch (e) {
        // Invalid cache, continue with fresh fetch
      }
    }
    
    // No valid cache, fetch fresh data
    fetchData();
  }, [key]);

  const refresh = () => fetchData();
  
  return { data, isLoading, error, isStale, refresh };
};

/**
 * Hook for debouncing rapid state updates
 */
export const useDebounce = function<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const throttledCallback = ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      return callback(...args);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - (now - lastCallRef.current));
    }
  }) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}