import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle, Wallet } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, formatCurrency, playSound } from '../utils';
import VipUpgradeButton from './VipUpgradeButton';

const WithdrawPanel: React.FC = () => {
  const { user, withdrawalRequests, requestWithdrawal } = useAppStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWithdraw = async () => {
    if (!user || isSubmitting) return;
    
    const withdrawAmount = parseInt(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) return;

    const tierConfig = TIER_CONFIGS[user.tier];
    
    // Validation
    if (withdrawAmount < tierConfig.minWithdrawal) {
      playSound('error');
      return;
    }
    
    if (withdrawAmount > user.coins) {
      playSound('error');
      return;
    }

    // Check daily limit
    const today = new Date().toDateString();
    const todayWithdrawals = withdrawalRequests.filter(
      w => w.requestedAt && new Date(w.requestedAt).toDateString() === today
    ).length;
    
    if (todayWithdrawals >= tierConfig.dailyWithdrawals) {
      playSound('error');
      return;
    }

    setIsSubmitting(true);
    
    const details = method === 'upi' 
      ? { upiId }
      : { bankAccount, ifscCode };

    try {
      const success = await requestWithdrawal(withdrawAmount, method, details);
      if (success) {
        setAmount('');
        setUpiId('');
        setBankAccount('');
        setIfscCode('');
        playSound('success');
      } else {
        playSound('error');
      }
    } catch (error) {
      playSound('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const tierConfig = TIER_CONFIGS[user.tier];
  const withdrawAmount = parseInt(amount) || 0;
  const canWithdraw = withdrawAmount >= tierConfig.minWithdrawal && withdrawAmount <= user.coins;
  
  // Calculate daily withdrawals used
  const today = new Date().toDateString();
  const todayWithdrawals = withdrawalRequests.filter(
    w => w.requestedAt && new Date(w.requestedAt).toDateString() === today
  ).length;
  const withdrawalsLeft = tierConfig.dailyWithdrawals - todayWithdrawals;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Withdraw Funds</h2>
          <p className="text-gray-400">Withdrawal panel with limits per tier</p>
        </div>
        
        {/* Available Balance */}
        <div className="text-right">
          <div className="text-sm text-gray-400">Available Balance</div>
          <div className="text-2xl font-bold gradient-text">
            {formatCurrency(user.coins)}
          </div>
        </div>
      </div>

      {/* Withdrawal Limits */}
      <div className="glass-panel p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary-400">
              {formatCurrency(tierConfig.minWithdrawal)}
            </div>
            <div className="text-xs text-gray-400">Minimum</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">
              {withdrawalsLeft}
            </div>
            <div className="text-xs text-gray-400">Remaining Today</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">
              {tierConfig.dailyWithdrawals}
            </div>
            <div className="text-xs text-gray-400">Daily Limit</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">
              {tierConfig.name}
            </div>
            <div className="text-xs text-gray-400">Current Tier</div>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="glass-panel p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-primary-400" />
          New Withdrawal Request
        </h3>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">
            Withdrawal Amount (₹)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ${tierConfig.minWithdrawal}`}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              ₹
            </div>
          </div>
          {withdrawAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className={cn(
                withdrawAmount >= tierConfig.minWithdrawal ? "text-green-400" : "text-red-400"
              )}>
                {withdrawAmount >= tierConfig.minWithdrawal ? "✓" : "✗"} Minimum: {formatCurrency(tierConfig.minWithdrawal)}
              </span>
              <span className={cn(
                withdrawAmount <= user.coins ? "text-green-400" : "text-red-400"
              )}>
                {withdrawAmount <= user.coins ? "✓" : "✗"} Available: {formatCurrency(user.coins)}
              </span>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => setMethod('upi')}
              className={cn(
                "p-4 rounded-lg border-2 transition-all duration-300 flex items-center space-x-3",
                method === 'upi'
                  ? "border-primary-500 bg-primary-500/10 text-primary-400"
                  : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl">📱</div>
              <div>
                <div className="font-medium">UPI</div>
                <div className="text-xs">Instant transfer</div>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => setMethod('bank')}
              className={cn(
                "p-4 rounded-lg border-2 transition-all duration-300 flex items-center space-x-3",
                method === 'bank'
                  ? "border-primary-500 bg-primary-500/10 text-primary-400"
                  : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl">🏦</div>
              <div>
                <div className="font-medium">Bank</div>
                <div className="text-xs">1-2 business days</div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Payment Details */}
        <AnimatePresence mode="wait">
          {method === 'upi' ? (
            <motion.div
              key="upi"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-gray-300">
                UPI ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@upi"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
              />
            </motion.div>
          ) : (
            <motion.div
              key="bank"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="Account number"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="IFSC code"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          onClick={handleWithdraw}
          disabled={!canWithdraw || withdrawalsLeft <= 0 || isSubmitting || 
            (method === 'upi' && !upiId) || 
            (method === 'bank' && (!bankAccount || !ifscCode))}
          className={cn(
            "w-full py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
            canWithdraw && withdrawalsLeft > 0 && !isSubmitting &&
            ((method === 'upi' && upiId) || (method === 'bank' && bankAccount && ifscCode))
              ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 neon-glow"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          )}
          whileHover={canWithdraw ? { scale: 1.02 } : {}}
          whileTap={canWithdraw ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : withdrawalsLeft <= 0 ? (
            <>
              <XCircle className="w-5 h-5" />
              <span>Daily Limit Reached</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Request Withdrawal</span>
            </>
          )}
        </motion.button>

        {/* Warnings */}
        {withdrawalsLeft <= 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">
              You've reached your daily withdrawal limit. Upgrade your tier for more withdrawals.
            </span>
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawalRequests.length > 0 && (
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center justify-between">
            <span className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary-400" />
              Withdrawal History
            </span>
            <span className="text-sm text-gray-400">
              {withdrawalRequests.length} requests
            </span>
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {withdrawalRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 rounded-lg border border-white/10"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <div className="font-semibold text-white">
                      {formatCurrency(request.amount)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString() : 'N/A'} • {request.method.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border",
                  getStatusColor(request.status)
                )}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {user.tier === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/40 rounded-lg p-6 text-center"
        >
          <div className="text-4xl mb-3">💎</div>
          <h4 className="text-lg font-bold text-white mb-2">Upgrade for Better Limits</h4>
          <p className="text-sm text-gray-400 mb-4">
            Get more daily withdrawals and lower minimum amounts with VIP tiers
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="font-semibold text-yellow-400">Bronze VIP</div>
              <div className="text-gray-300">3 withdrawals/day</div>
              <div className="text-gray-300">₹100 minimum</div>
            </div>
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="font-semibold text-blue-400">Diamond VIP</div>
              <div className="text-gray-300">5 withdrawals/day</div>
              <div className="text-gray-300">₹200 minimum</div>
            </div>
          </div>
          <motion.button
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 tap-effect neon-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View VIP Plans
          </motion.button>
        </motion.div>
      )}

      {/* VIP Upgrade Button - Only in withdraw section */}
      {user?.tier === 'free' && <VipUpgradeButton />}
    </div>
  );
};

export default WithdrawPanel;