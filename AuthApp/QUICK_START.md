# Quick Start Guide

## 🚀 React Native Authentication App

A complete React Native app with authentication flow, featuring login, registration, and dashboard functionality.

## Features

- ✅ **Login Screen** - Email/password authentication
- ✅ **Register Screen** - User registration with validation
- ✅ **Dashboard Screen** - User profile and quick actions
- ✅ **Persistent Login** - Uses AsyncStorage to maintain session
- ✅ **Modern UI** - Clean, responsive design
- ✅ **Cross-Platform** - Works on iOS and Android

## Demo Credentials

For testing the login functionality:
- **Email**: `test@example.com`
- **Password**: `password`

## Quick Start

1. **Navigate to the project directory**:
   ```bash
   cd AuthApp
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on your preferred platform**:
   - **iOS**: `npm run ios`
   - **Android**: `npm run android`
   - **Web**: `npm run web`

## App Flow

1. **First Launch**: App shows login screen
2. **Login**: Use demo credentials or register new account
3. **Registration**: Create new account with name, email, password
4. **Dashboard**: After authentication, user sees dashboard with:
   - User profile card
   - Statistics (demo data)
   - Quick action buttons
   - Logout option

## Project Structure

```
AuthApp/
├── src/
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Navigation configuration
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Login screen
│   │   ├── RegisterScreen.tsx   # Registration screen
│   │   └── DashboardScreen.tsx  # Dashboard screen
│   ├── components/              # Reusable components
│   ├── types/                  # TypeScript definitions
│   └── utils/                  # Utility functions
├── App.tsx                     # Main app component
├── package.json                # Dependencies
└── README.md                   # Detailed documentation
```

## Key Components

### Authentication Context
- Manages user login state
- Provides login/register/logout functions
- Persists user data using AsyncStorage

### Navigation
- Conditional navigation based on authentication state
- Loading screen while checking authentication
- Stack navigation for auth flow

### Screens
- **LoginScreen**: Email/password input with validation
- **RegisterScreen**: Full registration form with validation
- **DashboardScreen**: User profile and app features

## Customization

### Styling
All styles are in StyleSheet objects within each component. Modify colors, fonts, and layouts as needed.

### Authentication Logic
Currently uses simulated authentication. To integrate with a real backend:
1. Replace API calls in `AuthContext.tsx`
2. Update login/register functions
3. Handle real authentication tokens

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **Navigation errors**: Ensure all navigation dependencies are installed

3. **TypeScript errors**: Run `npx tsc --noEmit` to check for type errors

## Next Steps

1. **Add Real Backend**: Replace simulated authentication with real API calls
2. **Add More Screens**: Extend the app with additional features
3. **Add Push Notifications**: Implement push notification support
4. **Add Offline Support**: Implement offline functionality
5. **Add Testing**: Add unit and integration tests

## Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure all dependencies are installed
3. Try clearing the Metro cache
4. Check the README.md for detailed documentation 