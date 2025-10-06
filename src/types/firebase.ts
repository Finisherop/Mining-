export interface User {
  userId: string;
  username: string;
  stars: number;
  isVIP: boolean;
  earningMultiplier: number;
  boosts: number;
  referralCount: number;
  totalEarnings: number;
  lastActive: number;
  createdAt: number;
  vipExpiry: number | null;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebAppData {
  user?: TelegramUser;
  start_param?: string;
}