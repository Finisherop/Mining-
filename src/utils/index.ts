import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString()}`;
}

export function formatTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function triggerConfetti(origin?: { x: number; y: number }) {
  const defaults = {
    origin: origin || { y: 0.7 },
    spread: 60,
    ticks: 50,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 30,
  };

  // Burst of confetti
  confetti({
    ...defaults,
    particleCount: 50,
    colors: ['#22c5f0', '#ec58ff', '#f59e0b', '#10b981'],
  });

  // Side bursts
  confetti({
    ...defaults,
    particleCount: 25,
    angle: 60,
    origin: { x: 0, y: 0.7 },
  });

  confetti({
    ...defaults,
    particleCount: 25,
    angle: 120,
    origin: { x: 1, y: 0.7 },
  });
}

export function triggerCoinBurst(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 30,
    spread: 70,
    origin: { x, y },
    colors: ['#fbbf24', '#f59e0b', '#d97706'],
    shapes: ['circle'],
    scalar: 0.8,
  });
}

export function triggerStarBurst(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 20,
    spread: 50,
    origin: { x, y },
    colors: ['#fbbf24', '#f59e0b'],
    shapes: ['star'],
    scalar: 1.2,
  });
}

export function vibrate(pattern: number | number[] = 100) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export function playSound(type: 'coin' | 'success' | 'error' | 'click') {
  // In a real app, you would play actual sound files
  // For now, we'll just use vibration as feedback
  switch (type) {
    case 'coin':
      vibrate([50, 50, 50]);
      break;
    case 'success':
      vibrate([100, 50, 100]);
      break;
    case 'error':
      vibrate([200]);
      break;
    case 'click':
      vibrate(50);
      break;
  }
}

export function getTimeUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function isVipActive(vipExpiry?: Date): boolean {
  if (!vipExpiry) return false;
  return new Date() < vipExpiry;
}

export function getVipTimeRemaining(vipExpiry?: Date): string {
  if (!vipExpiry || !isVipActive(vipExpiry)) return '';
  return formatTimeRemaining(vipExpiry);
}

export function calculateFarmingEarnings(
  startTime: Date,
  baseRate: number,
  multiplier: number
): number {
  const now = new Date();
  const duration = (now.getTime() - startTime.getTime()) / 1000 / 60; // minutes
  return Math.floor(duration * baseRate * multiplier);
}

export function generateReferralCode(username: string): string {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 3).toUpperCase()}${random}`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false
  );
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}