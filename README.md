# Premium Bot Dashboard 🚀

A premium hybrid web dashboard for bot applications with advanced features, VIP tiers, and stunning animations.

## ✨ Features

### Layout & Navigation
- **Top Overlay Tabs**: Floating glass panels with Shop, VIP/Services, Boosts, and Events
- **Bottom Footer Tabs**: Fixed navigation for Farm, Tasks, Referral, Profile, and Withdraw
- **Responsive Design**: Adapts seamlessly from desktop to mobile

### Service Tiers
- **Free (0 Stars)**: 1 withdrawal/day, ₹200 min, Bronze badge, 1× farming
- **Bronze VIP (75 Stars)**: 3 withdrawals/day, ₹100 min, 2× farming, Platinum badge
- **Diamond VIP (150 Stars)**: 5 withdrawals/day, ₹200 min, 2.5× farming, Diamond badge, 1.5× referral rewards

### Core Features
- **Farming Dashboard**: Live coin accumulation with VIP multipliers
- **Daily Claim Calendar**: 7-day reward system with streak bonuses
- **Task System**: Daily, weekly, and special event tasks
- **Referral Program**: Earn from friend activities with VIP bonuses
- **Withdrawal System**: UPI and bank transfer support with tier limits
- **Shop & VIP**: Star-based purchases with unlock animations

### UI/UX Design
- **Dark Gradient Theme**: Beautiful #0b0f1a → #1b1330 background
- **Glass Morphism**: Backdrop-blur panels with neon cyan/pink accents
- **Micro-interactions**: Hover effects, tap animations, and visual feedback
- **Confetti & Animations**: Celebration effects for unlocks and achievements
- **Toast Notifications**: Real-time feedback for all actions

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Framer Motion** for animations
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Hot Toast** for notifications
- **Canvas Confetti** for celebration effects
- **Lucide React** for icons
- **Vite** for development and building

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd premium-bot-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## 📱 Mobile Optimization

The dashboard is fully responsive with:
- Touch-friendly tap targets
- Optimized layouts for mobile screens
- Swipe gestures and mobile-specific interactions
- Adaptive typography and spacing

## 🎨 Design System

### Colors
- **Primary**: Cyan (#22c5f0) to Purple (#ec58ff) gradients
- **Background**: Dark gradient (#0b0f1a → #1b1330)
- **Glass Panels**: Semi-transparent with backdrop blur
- **Accents**: Neon cyan/pink for highlights and active states

### Animations
- **Hover Effects**: Scale 1.03-1.05 with glow
- **Tap Effects**: Scale 0.95 with haptic feedback
- **Unlock Animations**: Confetti + neon glow rings
- **Loading States**: Smooth skeleton loaders

## 🔧 Configuration

### Tier Configuration
Edit `src/store/index.ts` to modify tier benefits:
```typescript
export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
  // Customize tier benefits here
}
```

### Styling
Customize colors and animations in `tailwind.config.js` and `src/index.css`.

## 📊 State Management

The app uses Zustand for state management with:
- User data and authentication
- Farming sessions and earnings
- Daily rewards and streaks
- Task completion tracking
- VIP status and benefits
- Real-time notifications

## 🔐 Security Features

- Input validation for all forms
- Rate limiting for actions
- Secure withdrawal processing
- Anti-fraud measures for purchases
- Audit logging for premium actions

## 🎯 Developer Features

- **Hot Reload**: Instant development feedback
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Responsive Testing**: Built-in mobile simulation
- **Performance Optimized**: Lazy loading and code splitting

## 📈 Analytics & Tracking

Built-in tracking for:
- User engagement metrics
- Conversion rates for VIP upgrades
- Task completion rates
- Withdrawal patterns
- Revenue analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code examples

---

Built with ❤️ for premium bot experiences