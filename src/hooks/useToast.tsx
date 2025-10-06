import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export const useToast = () => {
  const { notifications, markNotificationRead } = useAppStore();

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    unreadNotifications.forEach(notification => {
      const toastId = toast.custom(
        () => (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className={`
              max-w-md w-full bg-gradient-to-r backdrop-blur-md rounded-lg shadow-lg p-4 border
              ${notification.type === 'success' ? 'from-green-500/20 to-emerald-500/20 border-green-500/40' :
                notification.type === 'error' ? 'from-red-500/20 to-rose-500/20 border-red-500/40' :
                notification.type === 'warning' ? 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40' :
                'from-blue-500/20 to-cyan-500/20 border-blue-500/40'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                ${notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'error' ? 'bg-red-500' :
                  notification.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }
              `}>
                {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
                {notification.type === 'error' && <XCircle className="w-4 h-4 text-white" />}
                {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-white" />}
                {notification.type === 'info' && <Info className="w-4 h-4 text-white" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">
                  {notification.title}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {notification.message}
                </div>
                
                {notification.action && (
                  <button
                    onClick={() => {
                      notification.action!.onClick();
                      toast.dismiss(toastId);
                    }}
                    className="mt-2 text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    {notification.action.label}
                  </button>
                )}
              </div>
              
              <button
                onClick={() => toast.dismiss(toastId)}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ),
        {
          duration: notification.type === 'error' ? 6000 : 4000,
          position: 'top-right',
        }
      );

      // Mark as read after showing
      setTimeout(() => {
        markNotificationRead(notification.id);
      }, 100);
    });
  }, [notifications, markNotificationRead]);

  return null;
};

export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: '',
        style: {
          background: 'transparent',
          boxShadow: 'none',
        },
      }}
    />
  );
};