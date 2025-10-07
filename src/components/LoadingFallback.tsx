import React from 'react';
import { motion } from 'framer-motion';

interface LoadingFallbackProps {
  message?: string;
  type?: 'full' | 'component' | 'inline';
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Loading...", 
  type = 'component' 
}) => {
  if (type === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">{message}</span>
      </div>
    );
  }

  if (type === 'full') {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 text-center max-w-md mx-4"
        >
          <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
          <p className="text-gray-400">Please wait while we load your dashboard</p>
        </motion.div>
      </div>
    );
  }

  // Component type
  return (
    <div className="glass-panel p-6 space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel p-4">
              <div className="h-6 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          <div className="h-32 bg-gray-700 rounded-full mx-auto w-32"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;