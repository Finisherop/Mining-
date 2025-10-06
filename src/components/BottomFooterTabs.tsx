import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, CheckSquare, Users, User, CreditCard } from 'lucide-react';
import { useAppStore } from '../store';
import { cn, playSound } from '../utils';
import { TabType } from '../types';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
}

const BottomFooterTabs: React.FC = () => {
  const { activeTab, setActiveTab, user, tasks, notifications } = useAppStore();

  const tabs: TabConfig[] = [
    {
      id: 'farm',
      label: 'Farm',
      icon: <Sprout className="w-5 h-5" />,
      description: 'Main farming area, coin counter, multiplier applied'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="w-5 h-5" />,
      description: 'List of tasks to earn coins',
      badge: tasks.filter(t => !t.completed).length.toString()
    },
    {
      id: 'referral',
      label: 'Referral',
      icon: <Users className="w-5 h-5" />,
      description: 'Referral info & rewards',
      badge: user?.totalReferrals.toString()
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      description: 'User stats, VIP status, badges'
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Withdrawal panel with limits per tier',
      badge: notifications.filter(n => !n.read).length > 0 ? '!' : undefined
    }
  ];

  const handleTabClick = (tabId: TabType) => {
    playSound('click');
    setActiveTab(tabId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel-strong mx-4 mb-4 p-2 rounded-2xl"
      >
        <div className="flex items-center justify-around">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative group flex flex-col items-center justify-center",
                  "px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300",
                  "tap-effect min-w-[50px] sm:min-w-[60px]",
                  isActive
                    ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white neon-glow scale-105"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                <div className="relative">
                  {tab.icon}
                  
                  {/* Badge */}
                  {tab.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute -top-2 -right-2 min-w-[18px] h-[18px]",
                        "flex items-center justify-center",
                        "text-xs font-bold rounded-full",
                        tab.badge === '!'
                          ? "bg-red-500 text-white"
                          : "bg-primary-500 text-white"
                      )}
                    >
                      {tab.badge}
                    </motion.div>
                  )}
                </div>
                
                {/* Label */}
                <span className="text-xs font-medium mt-1 hidden sm:block">{tab.label}</span>
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeFooterTab"
                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Desktop Tooltip */}
                <div className={cn(
                  "absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2",
                  "bg-black/90 text-white text-xs px-3 py-2 rounded-lg",
                  "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  "pointer-events-none whitespace-nowrap z-10 hidden lg:block",
                  "before:absolute before:top-full before:left-1/2 before:transform before:-translate-x-1/2",
                  "before:border-4 before:border-transparent before:border-t-black/90"
                )}>
                  {tab.description}
                </div>
                
                {/* Glow Effect for Active Tab */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl opacity-30"
                    animate={{
                      boxShadow: [
                        '0 0 15px rgba(34, 197, 240, 0.3)',
                        '0 0 25px rgba(236, 88, 255, 0.4)',
                        '0 0 15px rgba(34, 197, 240, 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* VIP Status Indicator */}
        {user && user.vip_tier !== 'free' && user.vip_expiry && user.vip_expiry > Date.now() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="flex items-center justify-center mt-2 pt-2 border-t border-white/10"
          >
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">
                VIP Active
              </span>
              <span className="text-gray-400">
                • {Math.ceil((user.vip_expiry - Date.now()) / (1000 * 60 * 60 * 24))}d left
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default BottomFooterTabs;