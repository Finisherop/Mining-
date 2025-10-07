import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Monitor, Smartphone, Tablet } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [networkInfo, setNetworkInfo] = useState<string>('');

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

    // Network info detection
    const getNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setNetworkInfo(`${connection.effectiveType || 'unknown'} - ${connection.downlink || '?'}Mbps`);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('resize', detectDeviceType);
    
    detectDeviceType();
    getNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', detectDeviceType);
    };
  }, []);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-3 h-3" />;
      case 'tablet': return <Tablet className="w-3 h-3" />;
      default: return <Monitor className="w-3 h-3" />;
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
            <Wifi className="w-3 h-3 text-green-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Device Type */}
        <div className="flex items-center space-x-1 text-gray-400">
          {getDeviceIcon()}
          <span className="capitalize">{deviceType}</span>
        </div>

        {/* Network Speed (if available) */}
        {networkInfo && (
          <div className="text-gray-400">
            {networkInfo}
          </div>
        )}

        {/* Connection Indicator */}
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      </div>
    </motion.div>
  );
};

export default NetworkStatus;