import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'panel' | 'card' | 'list' | 'dashboard';
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'panel', 
  className = '' 
}) => {
  const shimmer = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  };

  const baseClasses = `
    bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 
    bg-[length:200%_100%] animate-pulse rounded-lg
  `;

  switch (type) {
    case 'dashboard':
      return (
        <div className={`glass-panel p-6 space-y-6 ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className={`w-12 h-12 rounded-lg ${baseClasses}`}
                {...shimmer}
              />
              <div className="space-y-2">
                <motion.div 
                  className={`h-6 w-48 ${baseClasses}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`h-4 w-32 ${baseClasses}`}
                  {...shimmer}
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <motion.div 
                key={i}
                className="glass-panel p-4 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <motion.div 
                  className={`h-4 w-20 mx-auto ${baseClasses}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`h-8 w-16 mx-auto ${baseClasses}`}
                  {...shimmer}
                />
              </motion.div>
            ))}
          </div>

          {/* Main Content */}
          <div className="space-y-4">
            <motion.div 
              className={`h-32 w-32 rounded-full mx-auto ${baseClasses}`}
              {...shimmer}
            />
            <motion.div 
              className={`h-4 w-64 mx-auto ${baseClasses}`}
              {...shimmer}
            />
          </div>
        </div>
      );

    case 'card':
      return (
        <motion.div 
          className={`glass-panel p-4 space-y-3 ${className}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className={`h-6 w-3/4 ${baseClasses}`}
            {...shimmer}
          />
          <motion.div 
            className={`h-4 w-full ${baseClasses}`}
            {...shimmer}
          />
          <motion.div 
            className={`h-4 w-2/3 ${baseClasses}`}
            {...shimmer}
          />
        </motion.div>
      );

    case 'list':
      return (
        <div className={`space-y-3 ${className}`}>
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i}
              className="glass-panel p-4 flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <motion.div 
                className={`w-12 h-12 rounded-full ${baseClasses}`}
                {...shimmer}
              />
              <div className="flex-1 space-y-2">
                <motion.div 
                  className={`h-4 w-3/4 ${baseClasses}`}
                  {...shimmer}
                />
                <motion.div 
                  className={`h-3 w-1/2 ${baseClasses}`}
                  {...shimmer}
                />
              </div>
              <motion.div 
                className={`h-8 w-16 ${baseClasses}`}
                {...shimmer}
              />
            </motion.div>
          ))}
        </div>
      );

    default: // panel
      return (
        <motion.div 
          className={`glass-panel p-6 space-y-4 ${className}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className={`h-8 w-1/2 ${baseClasses}`}
            {...shimmer}
          />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                className={`h-4 w-full ${baseClasses}`}
                {...shimmer}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </motion.div>
      );
  }
};

/**
 * Inline loader for specific sections
 */
export const InlineLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} border-2 border-primary-400 border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

/**
 * Subtle loading indicator for background operations
 */
export const BackgroundLoader: React.FC<{ message?: string }> = ({ 
  message = 'Updating...' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-4 right-4 z-50 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 flex items-center space-x-2"
    >
      <InlineLoader size="sm" />
      <span className="text-sm text-gray-300">{message}</span>
    </motion.div>
  );
};

export default LoadingSkeleton;