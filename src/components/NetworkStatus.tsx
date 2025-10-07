import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Monitor, Smartphone, Tablet, AlertTriangle } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [networkInfo, setNetworkInfo] = useState<string>('');
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'slow' | 'poor'>('good');
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Device came online');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log('❌ Device went offline');
    };

    // Device type detection
    const detectDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // Network info detection with quality assessment
    const getNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        const effectiveType = connection.effectiveType || 'unknown';
        const downlink = connection.downlink || 0;
        
        setNetworkInfo(`${effectiveType} - ${downlink}Mbps`);
        
        // Assess connection quality
        if (effectiveType === '4g' && downlink > 5) {
          setConnectionQuality('good');
        } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 5)) {
          setConnectionQuality('slow');
        } else {
          setConnectionQuality('poor');
        }
      }
    };

    // Monitor Firebase connection status
    const checkFirebaseStatus = () => {
      const firebaseConnected = (window as any).firebaseConnected;
      if (firebaseConnected === true) {
        setFirebaseStatus('connected');
      } else if (firebaseConnected === 'timeout') {
        setFirebaseStatus('offline');
      } else {
        setFirebaseStatus('connecting');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', detectDeviceType);
    
    detectDeviceType();
    getNetworkInfo();
    checkFirebaseStatus();

    // Check Firebase status periodically
    const firebaseInterval = setInterval(checkFirebaseStatus, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', detectDeviceType);
      clearInterval(firebaseInterval);
    };
  }, []);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-3 h-3" />;
      case 'tablet': return <Tablet className="w-3 h-3" />;
      default: return <Monitor className="w-3 h-3" />;
    }
  };

  const getConnectionColor = () => {
    if (!isOnline) return 'text-red-400';
    switch (connectionQuality) {
      case 'good': return 'text-green-400';
      case 'slow': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getFirebaseStatusColor = () => {
    switch (firebaseStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed top-4 right-4 z-50 ${className}`}
    >
      <div className="glass-panel px-3 py-2 flex items-center space-x-2 text-xs">
        {/* Network Status */}
        <div className="flex items-center space-x-1">
          {isOnline ? (
            connectionQuality === 'poor' ? (
              <AlertTriangle className="w-3 h-3 text-orange-400" />
            ) : (
              <Wifi className={`w-3 h-3 ${getConnectionColor()}`} />
            )
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span className={getConnectionColor()}>
            {isOnline ? (
              connectionQuality === 'good' ? 'Fast' : 
              connectionQuality === 'slow' ? 'Slow' : 'Poor'
            ) : 'Offline'}
          </span>
        </div>

        {/* Firebase Status */}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            firebaseStatus === 'connected' ? 'bg-green-400' :
            firebaseStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className={getFirebaseStatusColor()}>
            {firebaseStatus === 'connected' ? 'DB' :
             firebaseStatus === 'connecting' ? 'DB...' : 'DB✗'}
          </span>
        </div>

        {/* Device Type */}
        <div className="flex items-center space-x-1 text-gray-400">
          {getDeviceIcon()}
          <span className="capitalize">{deviceType}</span>
        </div>

        {/* Network Speed (if available) */}
        {networkInfo && connectionQuality !== 'good' && (
          <div className="text-gray-400 text-xs">
            {networkInfo}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NetworkStatus;