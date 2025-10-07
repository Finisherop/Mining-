/**
 * Network utility functions for handling slow connections and offline scenarios
 */

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  quality: 'good' | 'slow' | 'poor';
}

/**
 * Get current network status with quality assessment
 */
export function getNetworkStatus(): NetworkStatus {
  const isOnline = navigator.onLine;
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  let connectionType = 'unknown';
  let effectiveType = 'unknown';
  let downlink = 0;
  let quality: 'good' | 'slow' | 'poor' = 'good';
  
  if (connection) {
    connectionType = connection.type || 'unknown';
    effectiveType = connection.effectiveType || 'unknown';
    downlink = connection.downlink || 0;
    
    // Assess connection quality
    if (effectiveType === '4g' && downlink > 5) {
      quality = 'good';
    } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 5)) {
      quality = 'slow';
    } else if (effectiveType === '2g' || downlink < 1) {
      quality = 'poor';
    }
  }
  
  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
    quality
  };
}

/**
 * Check if Firebase is connected
 */
export function isFirebaseConnected(): boolean {
  return (window as any).firebaseConnected === true;
}

/**
 * Check if Firebase connection timed out
 */
export function isFirebaseTimeout(): boolean {
  return (window as any).firebaseConnected === 'timeout';
}

/**
 * Get Firebase connection status
 */
export function getFirebaseStatus(): 'connected' | 'connecting' | 'timeout' | 'error' {
  const status = (window as any).firebaseConnected;
  if (status === true) return 'connected';
  if (status === 'timeout') return 'timeout';
  if (status === false) return 'error';
  return 'connecting';
}

/**
 * Retry Firebase connection
 */
export function retryFirebaseConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('🔄 Retrying Firebase connection...');
    
    try {
      const database = (window as any).database;
      const firebaseRef = (window as any).firebaseRef;
      const firebaseOnValue = (window as any).firebaseOnValue;
      
      if (database && firebaseRef && firebaseOnValue) {
        const connectedRef = firebaseRef(database, '.info/connected');
        const unsubscribe = firebaseOnValue(connectedRef, (snapshot: any) => {
          if (snapshot.val() === true) {
            console.log('✅ Firebase reconnected successfully');
            (window as any).firebaseConnected = true;
            unsubscribe();
            resolve(true);
          }
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          unsubscribe();
          resolve(false);
        }, 10000);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error('❌ Firebase retry failed:', error);
      resolve(false);
    }
  });
}

/**
 * Show network status notification
 */
export function showNetworkNotification(status: NetworkStatus) {
  if (!status.isOnline) {
    return {
      type: 'error',
      message: 'You are offline. Some features may not work.',
      icon: '📡'
    };
  }
  
  if (status.quality === 'poor') {
    return {
      type: 'warning',
      message: 'Poor network connection detected. App may load slowly.',
      icon: '🐌'
    };
  }
  
  if (status.quality === 'slow') {
    return {
      type: 'info',
      message: 'Slow network detected. Loading may take longer.',
      icon: '⏳'
    };
  }
  
  return null;
}

/**
 * Get user-friendly connection description
 */
export function getConnectionDescription(status: NetworkStatus): string {
  if (!status.isOnline) {
    return 'You are currently offline';
  }
  
  const speed = status.downlink > 0 ? `${status.downlink}Mbps` : 'Unknown speed';
  const type = status.effectiveType.toUpperCase();
  
  switch (status.quality) {
    case 'good':
      return `Fast connection (${type}, ${speed})`;
    case 'slow':
      return `Slow connection (${type}, ${speed})`;
    case 'poor':
      return `Poor connection (${type}, ${speed})`;
    default:
      return `Connected (${type}, ${speed})`;
  }
}

/**
 * Check if we should show slow network warning
 */
export function shouldShowSlowNetworkWarning(): boolean {
  const status = getNetworkStatus();
  const firebaseStatus = getFirebaseStatus();
  
  return (
    !status.isOnline ||
    status.quality === 'poor' ||
    firebaseStatus === 'timeout' ||
    firebaseStatus === 'error'
  );
}

/**
 * Get recommended actions for current network status
 */
export function getNetworkRecommendations(status: NetworkStatus): string[] {
  const recommendations: string[] = [];
  
  if (!status.isOnline) {
    recommendations.push('Check your internet connection');
    recommendations.push('Try switching between WiFi and mobile data');
  } else if (status.quality === 'poor') {
    recommendations.push('Move closer to your WiFi router');
    recommendations.push('Try switching to mobile data');
    recommendations.push('Close other apps using internet');
  } else if (status.quality === 'slow') {
    recommendations.push('Close other apps using internet');
    recommendations.push('Wait for better network conditions');
  }
  
  if (!isFirebaseConnected()) {
    recommendations.push('Clear browser cache and reload');
    recommendations.push('Try using a VPN if available');
  }
  
  return recommendations;
}