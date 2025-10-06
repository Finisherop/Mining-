import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, CreditCard, X, Copy, Check, Loader2 } from 'lucide-react';
import { useAppStore, TIER_CONFIGS } from '../store';
import { cn, copyToClipboard, playSound } from '../utils';
import { createTelegramStarInvoice, sendTelegramMessage } from '../services/telegram';
import { addWithdrawal } from '../firebase/hooks';
import toast from 'react-hot-toast';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'bronze' | 'diamond';
}

const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({ isOpen, onClose, tier }) => {
  const { user, setUser } = useAppStore();
  const [paymentMethod, setPaymentMethod] = useState<'stars' | 'upi'>('stars');
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const tierConfig = TIER_CONFIGS[tier];
  const upiId = 'admin@upi'; // Admin UPI ID

  const handleStarPayment = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    playSound('click');

    try {
      // Create Telegram Star invoice
      const invoice = await createTelegramStarInvoice(
        parseInt(user.userId),
        `${tierConfig.name} VIP Upgrade`,
        `Upgrade to ${tierConfig.name} and unlock premium features!`,
        `vip_${tier}_${user.userId}_${Date.now()}`,
        tierConfig.starCost
      );

      if (invoice) {
        // Open invoice in Telegram WebApp
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openInvoice(invoice.invoice_link, (status) => {
            if (status === 'paid') {
              // Payment successful - activate VIP
              activateVip();
              toast.success('🎉 VIP Activated! Payment successful!');
              playSound('success');
            } else if (status === 'cancelled') {
              toast.error('Payment cancelled');
              playSound('error');
            } else if (status === 'failed') {
              toast.error('Payment failed. Please try again.');
              playSound('error');
            }
            setIsProcessing(false);
          });
        } else {
          // Fallback for non-Telegram environment
          window.open(invoice.invoice_link, '_blank');
          toast.info('Complete payment in the opened window');
          setIsProcessing(false);
        }
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Star payment error:', error);
      toast.error('Failed to create payment. Please try again.');
      playSound('error');
      setIsProcessing(false);
    }
  };

  const handleUpiPayment = async () => {
    if (!user || !utrNumber.trim() || isProcessing) return;

    setIsProcessing(true);
    playSound('click');

    try {
      // Create manual payment request
      const withdrawalData = {
        amount: tierConfig.starCost * 10, // Convert stars to rupees (example rate)
        status: 'pending' as const,
        requestedAt: Date.now(),
        method: 'vip_upgrade_upi',
        details: {
          tier,
          utrNumber: utrNumber.trim(),
          userId: user.userId,
          username: user.username
        }
      };

      const withdrawalId = await addWithdrawal(withdrawalData);
      
      if (withdrawalId) {
        // Send notification to admin
        await sendTelegramMessage(
          123456789, // Admin chat ID
          `🔔 <b>New VIP Upgrade Request</b>\n\n` +
          `👤 User: ${user.username} (${user.userId})\n` +
          `💎 Tier: ${tierConfig.name}\n` +
          `💰 Amount: ₹${tierConfig.starCost * 10}\n` +
          `🏦 UTR: ${utrNumber}\n` +
          `📅 Time: ${new Date().toLocaleString()}\n\n` +
          `Please verify payment and activate VIP manually.`
        );

        toast.success('VIP upgrade request submitted! Admin will verify and activate within 24 hours.');
        setUtrNumber('');
        onClose();
        playSound('success');
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('UPI payment error:', error);
      toast.error('Failed to submit request. Please try again.');
      playSound('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const activateVip = () => {
    if (!user) return;

    const vipExpiry = Date.now() + (tierConfig.duration * 24 * 60 * 60 * 1000);
    
    const updatedUser = {
      ...user,
      tier,
      vip_tier: tier,
      vip_expiry: vipExpiry,
      vipExpiry: vipExpiry,
      multiplier: tierConfig.farmingMultiplier,
      withdraw_limit: tierConfig.dailyWithdrawals,
      referral_boost: tierConfig.referralMultiplier,
      badges: [
        ...user.badges,
        {
          type: tierConfig.badge,
          name: `${tierConfig.name} Member`,
          description: `Upgraded to ${tierConfig.name}`,
          icon: tier === 'bronze' ? '🥉' : '💎',
          color: tierConfig.color,
          unlockedAt: Date.now()
        }
      ]
    };

    setUser(updatedUser);
    onClose();
  };

  const handleCopyUpi = async () => {
    const success = await copyToClipboard(upiId);
    if (success) {
      setCopied(true);
      playSound('success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r from-${tierConfig.color}/20 to-${tierConfig.color}/10`}>
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Upgrade to {tierConfig.name}</h3>
                  <p className="text-sm text-gray-400">Choose your payment method</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Premium Features</h4>
              <div className="space-y-2">
                {tierConfig.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">Payment Method</h4>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => setPaymentMethod('stars')}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center space-y-2",
                    paymentMethod === 'stars'
                      ? "border-primary-500 bg-primary-500/10 text-primary-400"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Star className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">Telegram Stars</div>
                    <div className="text-xs">⭐ {tierConfig.starCost} Stars</div>
                    <div className="text-xs text-green-400">Instant Activation</div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setPaymentMethod('upi')}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center space-y-2",
                    paymentMethod === 'upi'
                      ? "border-primary-500 bg-primary-500/10 text-primary-400"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CreditCard className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">UPI Payment</div>
                    <div className="text-xs">₹{tierConfig.starCost * 10}</div>
                    <div className="text-xs text-yellow-400">Manual Verification</div>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Payment Details */}
            <AnimatePresence mode="wait">
              {paymentMethod === 'stars' ? (
                <motion.div
                  key="stars"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-400 mb-2">⭐ Telegram Stars Payment</h5>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Secure payment via Telegram Stars</li>
                      <li>• VIP benefits activate instantly</li>
                      <li>• No manual verification needed</li>
                      <li>• Official Telegram payment system</li>
                    </ul>
                  </div>

                  <motion.button
                    onClick={handleStarPayment}
                    disabled={isProcessing}
                    className={cn(
                      "w-full py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
                      "bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 neon-glow"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5" />
                        <span>Pay {tierConfig.starCost} Stars</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                    <h5 className="font-semibold text-green-400 mb-2">💳 UPI Payment</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Admin UPI ID:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2">
                            <span className="text-white font-mono">{upiId}</span>
                          </div>
                          <button
                            onClick={handleCopyUpi}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              copied ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            )}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Amount to Pay:</label>
                        <div className="text-2xl font-bold text-green-400">₹{tierConfig.starCost * 10}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      UTR Transaction Number *
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter 12-digit UTR number"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-gray-400">
                      Pay to the UPI ID above and enter the UTR number you receive
                    </p>
                  </div>

                  <motion.button
                    onClick={handleUpiPayment}
                    disabled={!utrNumber.trim() || isProcessing}
                    className={cn(
                      "w-full py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2",
                      utrNumber.trim() && !isProcessing
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                    whileHover={utrNumber.trim() && !isProcessing ? { scale: 1.02 } : {}}
                    whileTap={utrNumber.trim() && !isProcessing ? { scale: 0.98 } : {}}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Submit Payment Proof</span>
                      </>
                    )}
                  </motion.button>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-xs text-yellow-400">
                      ⚠️ Manual verification takes up to 24 hours. You'll be notified once VIP is activated.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VipUpgradeModal;