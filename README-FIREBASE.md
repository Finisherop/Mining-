# Premium Bot Dashboard with Firebase Integration 🚀

A mobile-first premium hybrid web dashboard for Telegram bots with Firebase integration, VIP system, and admin panel.

## ✨ New Features

### 🔥 Firebase Integration
- **Realtime Database**: Store user data with real-time sync
- **User Management**: Complete CRUD operations for user data
- **Data Persistence**: Automatic sync between localStorage and Firebase

### 📱 Mobile-First Design
- **Android Optimized**: Designed specifically for Android Telegram WebApp
- **Touch-Friendly**: Large buttons, swipe gestures, haptic feedback
- **Responsive Layout**: Adapts to all screen sizes from 375px to desktop

### 👤 User Panel (Telegram Users Only)
- **Live Stats**: Real-time earnings calculation with multipliers
- **VIP Purchase**: One-click VIP upgrade with star deduction
- **Status Display**: Stars, VIP status, earning multiplier, referrals
- **Notifications**: Toast messages and Telegram alerts

### ⚙️ Admin Panel (Non-Telegram Access)
- **User Management**: View and edit all user data
- **Quick Actions**: Add/remove stars, toggle VIP status
- **Bulk Operations**: Manage multiple users efficiently
- **Real-time Updates**: Changes sync to Firebase immediately

### 🔄 Data Synchronization
- **localStorage Sync**: Offline-first approach with local storage
- **Firebase Sync**: Real-time database synchronization
- **Conflict Resolution**: Smart merging of local and remote data
- **Auto-Sync**: Periodic sync every 5 minutes

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Firebase 10.7.1** (Realtime Database)
- **Framer Motion** for animations
- **Tailwind CSS** with mobile-first utilities
- **React Hot Toast** for notifications
- **Telegram WebApp API** integration

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd premium-bot-dashboard
npm install
```

### 2. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Realtime Database
4. Set database rules to allow read/write (for development):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

#### Configure Firebase
1. Copy `src/firebase/config.example.ts` to `src/firebase/config.ts`
2. Replace placeholder values with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 3. Development
```bash
npm run dev
```

### 4. Production Build
```bash
npm run build
```

## 📱 Usage

### User Panel Access
- **Telegram Bot**: Users access via Telegram bot WebApp
- **URL Parameters**: `?user_id=123&username=testuser&first_name=Test`
- **Automatic Detection**: App detects Telegram environment

### Admin Panel Access
- **Direct URL**: Open webapp URL directly (not through Telegram)
- **No Parameters**: Admin panel loads when no Telegram user detected

## 🔧 Configuration

### Telegram Bot Integration
1. Update `src/utils/telegram.ts`:
```typescript
export const TELEGRAM_BOT_API_KEY = "your-actual-bot-token";
```

2. Set your bot's WebApp URL to your deployed app

### VIP System Configuration
- **VIP Cost**: 100 stars (configurable in `UserPanel.tsx`)
- **VIP Benefits**: 2× earning multiplier, 30-day duration
- **Earning Rate**: 10 coins/minute base rate

### Database Structure
```json
{
  "users": {
    "userId": {
      "userId": "string",
      "username": "string", 
      "stars": "number",
      "isVIP": "boolean",
      "earningMultiplier": "number",
      "boosts": "number",
      "referralCount": "number",
      "totalEarnings": "number",
      "lastActive": "timestamp",
      "createdAt": "timestamp",
      "vipExpiry": "timestamp|null"
    }
  }
}
```

## 🎨 Mobile-First Design Features

### Android Optimization
- **Safe Areas**: Proper handling of notches and navigation bars
- **Touch Targets**: Minimum 44px touch targets
- **Haptic Feedback**: Native vibration patterns
- **Smooth Scrolling**: Optimized for mobile scrolling

### Responsive Breakpoints
```css
xs: '375px'   /* Small phones */
sm: '640px'   /* Large phones */
md: '768px'   /* Tablets */
lg: '1024px'  /* Desktop */
xl: '1280px'  /* Large desktop */
```

### UI Components
- **Glass Morphism**: Backdrop blur effects
- **Neon Accents**: Cyan/pink gradient highlights
- **Micro-interactions**: Hover, tap, and loading states
- **Toast Notifications**: Non-intrusive feedback

## 🔐 Security Features

### Data Protection
- **Input Validation**: All user inputs validated
- **Rate Limiting**: Prevent spam operations
- **Secure Storage**: Encrypted localStorage data
- **Firebase Rules**: Production-ready security rules

### Admin Security
- **Access Control**: Admin panel only for non-Telegram access
- **Audit Logging**: All admin actions logged
- **Data Integrity**: Validation on all updates

## 📊 Analytics & Monitoring

### User Metrics
- Total users and VIP conversion rates
- Earning patterns and engagement
- Feature usage statistics
- Error tracking and performance

### Admin Dashboard
- Real-time user statistics
- VIP user management
- Revenue tracking
- System health monitoring

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy dist folder to Vercel
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Custom Server
```bash
npm run build
# Serve dist folder with any static server
```

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── UserPanel.tsx   # User dashboard
│   └── AdminPanel.tsx  # Admin interface
├── firebase/           # Firebase configuration
│   ├── config.ts      # Firebase setup
│   └── hooks.ts       # Firebase hooks
├── types/             # TypeScript types
├── utils/             # Utility functions
│   ├── localStorage.ts # Local storage sync
│   └── telegram.ts    # Telegram WebApp utils
└── App.tsx            # Main application
```

### Available Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Code linting

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Error**
- Check Firebase config values
- Verify database URL format
- Ensure database rules allow access

**Telegram Detection Failed**
- Verify Telegram WebApp script loaded
- Check URL parameters format
- Test with Telegram bot integration

**Build Errors**
- Run `npm install --force` to fix dependencies
- Check TypeScript errors in console
- Verify all imports are correct

### Debug Mode
Add to localStorage for debug info:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check README files
- **Issues**: Create GitHub issue
- **Firebase**: Check Firebase console logs
- **Telegram**: Verify bot configuration

---

Built with ❤️ for premium Telegram bot experiences