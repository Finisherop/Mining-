import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { cn } from '../utils';
import TopOverlayTabs from './TopOverlayTabs';
import BottomFooterTabs from './BottomFooterTabs';
import FarmingDashboard from './FarmingDashboard';
import DailyClaimCalendar from './DailyClaimCalendar';
import ShopPanel from './ShopPanel';
import VipPanel from './VipPanel';
import TasksPanel from './TasksPanel';
import ReferralPanel from './ReferralPanel';
import ProfilePanel from './ProfilePanel';
import WithdrawPanel from './WithdrawPanel';
import VipUpgradeButton from './VipUpgradeButton';

const Layout: React.FC = () => {
  const { activeTab, activeOverlayTab } = useAppStore();

  const renderMainContent = () => {
    switch (activeTab) {
      case 'farm':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Side - Farming Dashboard + Daily Claim */}
            <div className="space-y-6">
              <FarmingDashboard />
              <DailyClaimCalendar />
            </div>
            
            {/* Right Side - Overlay Content */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {activeOverlayTab === 'shop' && (
                  <motion.div
                    key="shop"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShopPanel />
                  </motion.div>
                )}
                {activeOverlayTab === 'vip' && (
                  <motion.div
                    key="vip"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <VipPanel />
                  </motion.div>
                )}
                {!activeOverlayTab && (
                  <motion.div
                    key="welcome"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-panel p-8 h-full flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4">🚀</div>
                      <h3 className="text-2xl font-bold gradient-text mb-2">
                        Welcome to Premium Dashboard
                      </h3>
                      <p className="text-gray-400">
                        Select a tab above to explore premium features
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      case 'tasks':
        return <TasksPanel />;
      case 'referral':
        return <ReferralPanel />;
      case 'profile':
        return <ProfilePanel />;
      case 'withdraw':
        return <WithdrawPanel />;
      default:
        return <FarmingDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500/10 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary-500/10 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-primary-400/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top Overlay Tabs */}
      <TopOverlayTabs />

      {/* Main Content Area */}
      <main className={cn(
        "px-4 pt-24 pb-24 transition-all duration-300",
        "lg:px-8",
        activeTab === 'farm' ? "max-w-7xl mx-auto" : "max-w-4xl mx-auto"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderMainContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Footer Tabs */}
      <BottomFooterTabs />
      
      {/* VIP Upgrade Button - Only show on withdraw tab for free users */}
      {activeTab === 'withdraw' && <VipUpgradeButton />}
    </div>
  );
};

export default Layout;