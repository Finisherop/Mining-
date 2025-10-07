import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, Loader2 } from 'lucide-react';
import { InitializationState, InitializationStep, initManager } from '../utils/initializationManager';

interface StepByStepLoaderProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

const StepByStepLoader: React.FC<StepByStepLoaderProps> = ({ onComplete, onError }) => {
  const [initState, setInitState] = useState<InitializationState>(initManager.getState());

  useEffect(() => {
    // Subscribe to initialization state changes
    const unsubscribe = initManager.subscribe((state) => {
      setInitState(state);
      
      if (state.isComplete) {
        setTimeout(() => onComplete(), 500); // Small delay for smooth transition
      }
      
      if (state.hasError) {
        const currentStep = state.steps[state.currentStep];
        onError(currentStep.error || 'Unknown initialization error');
      }
    });

    // Start initialization
    initManager.initialize();

    return unsubscribe;
  }, [onComplete, onError]);

  const getStepIcon = (step: InitializationStep, index: number) => {
    const isActive = index === initState.currentStep;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return (
          <Circle 
            className={`w-5 h-5 ${
              isActive ? 'text-blue-400' : 'text-gray-600'
            }`} 
          />
        );
    }
  };

  const getStepColor = (step: InitializationStep, index: number) => {
    const isActive = index === initState.currentStep;
    
    switch (step.status) {
      case 'completed':
        return 'text-green-400';
      case 'loading':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      default:
        return isActive ? 'text-white' : 'text-gray-400';
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = initState.steps.filter(step => step.status === 'completed').length;
    return (completedSteps / initState.steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 text-center max-w-md w-full"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-2">Mining PRO</h2>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Step {initState.currentStep + 1} of {initState.steps.length}
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {initState.steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  index === initState.currentStep 
                    ? 'bg-blue-900/30 border border-blue-600/30' 
                    : step.status === 'completed'
                    ? 'bg-green-900/20'
                    : step.status === 'failed'
                    ? 'bg-red-900/20'
                    : 'bg-gray-800/30'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(step, index)}
                </div>
                
                <div className="flex-1 text-left">
                  <div className={`font-medium ${getStepColor(step, index)}`}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {step.description}
                  </div>
                  {step.error && (
                    <div className="text-xs text-red-400 mt-1">
                      Error: {step.error}
                    </div>
                  )}
                </div>

                {step.status === 'loading' && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Current Step Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={initState.currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-gray-400 mb-6"
          >
            {initState.steps[initState.currentStep]?.description}
          </motion.div>
        </AnimatePresence>

        {/* Error Recovery */}
        {initState.hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 space-y-3"
          >
            <button
              onClick={() => {
                initManager.reset();
                initManager.initialize();
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
            >
              🔄 Retry Initialization
            </button>
            
            <button
              onClick={() => {
                // Skip to UI render step for emergency access
                initManager.skipToStep(4);
                setTimeout(() => onComplete(), 500);
              }}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ⚡ Continue with Limited Features
            </button>
          </motion.div>
        )}

        {/* Loading Animation */}
        {!initState.hasError && (
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StepByStepLoader;