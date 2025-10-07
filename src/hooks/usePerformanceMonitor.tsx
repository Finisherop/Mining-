import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  fps: number;
  isSlowDevice: boolean;
}

/**
 * Hook to monitor app performance and optimize accordingly
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    isSlowDevice: false
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const renderStartRef = useRef(performance.now());

  useEffect(() => {
    let animationId: number;
    
    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      // Calculate FPS every second
      if (now - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          isSlowDevice: fps < 30 // Consider device slow if FPS drops below 30
        }));
        
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Measure memory usage if available
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Measure render time
  const startRender = () => {
    renderStartRef.current = performance.now();
  };

  const endRender = () => {
    const renderTime = performance.now() - renderStartRef.current;
    setMetrics(prev => ({
      ...prev,
      renderTime
    }));
  };

  return {
    metrics,
    startRender,
    endRender,
    // Performance optimization suggestions
    shouldReduceAnimations: metrics.fps < 30,
    shouldReduceEffects: metrics.memoryUsage ? metrics.memoryUsage > 100 : false,
    shouldUseLowQuality: metrics.isSlowDevice
  };
};

/**
 * Hook to optimize animations based on device performance
 */
export const useOptimizedAnimations = () => {
  const { shouldReduceAnimations, shouldReduceEffects } = usePerformanceMonitor();
  
  return {
    // Reduce animation duration for slow devices
    duration: shouldReduceAnimations ? 0.2 : 0.6,
    // Disable complex animations on slow devices
    enableComplexAnimations: !shouldReduceAnimations,
    // Reduce particle effects
    enableParticleEffects: !shouldReduceEffects,
    // Optimize motion settings
    motionConfig: {
      duration: shouldReduceAnimations ? 0.2 : 0.6,
      ease: shouldReduceAnimations ? 'linear' : 'easeOut',
      reduce: shouldReduceAnimations
    }
  };
};

/**
 * Hook to detect network quality and adjust data fetching
 */
export const useNetworkOptimization = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false
        });
      }
    };

    updateNetworkInfo();
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return {
    networkInfo,
    isSlowNetwork: networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g',
    shouldPreloadImages: networkInfo.effectiveType === '4g' && !networkInfo.saveData,
    shouldReduceDataUsage: networkInfo.saveData || networkInfo.effectiveType === 'slow-2g',
    recommendedUpdateInterval: networkInfo.effectiveType === '4g' ? 1000 : 3000
  };
};