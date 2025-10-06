# 🔥 Firebase Setup Guide

## Quick Setup Steps

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tap-and-earn-d3583**
3. Navigate to **Realtime Database**
4. Click **Create Database**
5. Choose **Start in test mode** (for now)

### 2. Database Rules
Copy the rules from `database.rules.json` to your Firebase Console:

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['userId', 'username', 'stars', 'isVIP', 'earningMultiplier'])"
      }
    },
    "admin": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 3. Database URL
Your database URL should be:
```
https://tap-and-earn-d3583-default-rtdb.firebaseio.com/
```

### 4. Test Connection
1. Start the development server: `npm run dev`
2. Check browser console for: `🔥 Firebase initialized successfully`
3. Test user creation with URL parameters
4. Verify data appears in Firebase Console

## 🧪 Testing

### Admin Panel
- **URL**: `http://localhost:3002/`
- **Expected**: Real Firebase users or demo users
- **Features**: User management, statistics, real-time updates

### User Panel
- **URL**: `http://localhost:3002/?user_id=123456789&username=testuser&first_name=John`
- **Expected**: Creates new user in Firebase
- **Features**: VIP purchase, earnings, real-time sync

## 🔐 Security (Production)

For production, update the database rules to be more restrictive:

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "$userId === auth.uid || root.child('admin').child(auth.uid).exists()",
        ".write": "$userId === auth.uid || root.child('admin').child(auth.uid).exists()",
        ".validate": "newData.hasChildren(['userId', 'username', 'stars', 'isVIP', 'earningMultiplier'])"
      }
    },
    "admin": {
      ".read": "root.child('admin').child(auth.uid).exists()",
      ".write": "root.child('admin').child(auth.uid).exists()"
    }
  }
}
```

## 📊 Database Structure

Your data will be stored like this:

```json
{
  "users": {
    "123456789": {
      "userId": "123456789",
      "username": "john_doe",
      "stars": 150,
      "isVIP": true,
      "earningMultiplier": 2,
      "boosts": 3,
      "referralCount": 5,
      "totalEarnings": 2500,
      "lastActive": 1696615200000,
      "createdAt": 1696010400000,
      "vipExpiry": 1699207200000
    }
  }
}
```

## 🚀 Ready to Go!

Your Firebase project **tap-and-earn-d3583** is now configured and ready to use. The app will automatically connect and start syncing user data in real-time!