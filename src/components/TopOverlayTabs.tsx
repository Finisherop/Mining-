import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Crown, Zap, Calendar } from 'lucide-react';
import { useAppStore } from '../store';
import { cn, triggerConfetti, playSound } from '../utils';
import { OverlayTabType } from '../types';

interface TabConfig {
  id: OverlayTabType;
  label: string;
  icon: React.ReactNode;
  description: string;
  gradient: string;
}

const tabs: TabConfig[] = [
  {
    id: 'shop',
    label: 'Shop',
    icon: <ShoppingBag className="w-5 h-5" />,
    description: 'Tiered Star purchases, VIP unlocks, animated badges',
    gradient: 'from-primary-500 to-primary-600'
  },
  {
    id: 'vip',
    label: 'VIP / Services',
    icon: <Crown className="w-5 h-5" />,
    description: 'Quick VIP overview, perks, multiplier info',
    gradient: 'from-secondary-500 to-secondary-600'
  },
  {
    id: 'boosts',
    label: 'Boosts',
    icon: <Zap className="w-5 h-5" />,
    description: 'Premium boosts and multipliers',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'events',
    label: 'Events',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Limited-time events and special offers',
    gradient: 'from-green-500 to-emerald-600'
  }
];

const TopOverlayTabs: React.FC = () => {
  const { activeOverlayTab, setActiveOverlayTab, user } = useAppStore();

  const handleTabClick = (tabId: OverlayTabType) => {
    playSound('click');
    
    if (activeOverlayTab === tabId) {
      setActiveOverlayTab(null);
    } else {
      setActiveOverlayTab(tabId);
      
      // Trigger special effects for premium tabs
      if (tabId === 'shop' || tabId === 'vip') {
        setTimeout(() => {
          triggerConfetti({ x: 0.5, y: 0.2 });
        }, 300);
      }
    }
  };

  return (
    <div className="fixed top-2 left-2 right-2 z-50">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel-strong p-2 flex items-center justify-between overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab, index) => {
          const isActive = activeOverlayTab === tab.id;
          const isVipTab = tab.id === 'vip' || tab.id === 'boosts';
          const hasVipAccess = user?.tier !== 'free';
          
          return (
            <motion.button
              key={tab.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleTabClick(tab.id)}
              disabled={isVipTab && !hasVipAccess}
              className={cn(
                "relative group px-3 py-2 rounded-lg transition-all duration-300",
                "flex items-center space-x-1 min-w-[80px] flex-shrink-0",
                "tap-effect hover-lift",
                isActive
                  ? "bg-gradient-to-r text-white neon-glow-strong scale-105"
                  : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white",
                isVipTab && !hasVipAccess && "opacity-50 cursor-not-allowed",
                isActive && `bg-gradient-to-r ${tab.gradient}`
              )}
              whileHover={!isVipTab || hasVipAccess ? { scale: 1.05 } : {}}
              whileTap={!isVipTab || hasVipAccess ? { scale: 0.95 } : {}}
            >
              {/* VIP Lock Overlay */}
              {isVipTab && !hasVipAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                  <Crown className="w-4 h-4 text-yellow-400" />
                </div>
              )}
              
              {/* Tab Content */}
              <div className={cn(
                "flex items-center space-x-1",
                isVipTab && !hasVipAccess && "blur-sm"
              )}>
                <div className="w-4 h-4">{tab.icon}</div>
                <span className="font-medium text-xs hidden sm:inline">{tab.label}</span>
              </div>
              
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              {/* Hover Tooltip */}
              <div className={cn(
                "absolute top-full mt-2 left-1/2 transform -translate-x-1/2",
                "bg-black/90 text-white text-xs px-3 py-2 rounded-lg",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "pointer-events-none whitespace-nowrap z-10",
                "before:absolute before:bottom-full before:left-1/2 before:transform before:-translate-x-1/2",
                "before:border-4 before:border-transparent before:border-b-black/90"
              )}>
                {tab.description}
              </div>
              
              {/* Glow Effect */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-50"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(34, 197, 240, 0.3)',
                      '0 0 40px rgba(236, 88, 255, 0.4)',
                      '0 0 20px rgba(34, 197, 240, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
          );
        })}
        
        {/* Premium Badge */}
        {user?.tier !== 'free' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="ml-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold rounded-full vip-badge"
          >
            VIP
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TopOverlayTabs;