# React Native Authentication App

A complete React Native app with authentication flow, featuring login, registration, and dashboard functionality.

## Features

- 🔐 **Authentication Flow**: Login and registration screens
- 📱 **Cross-Platform**: Works on both iOS and Android
- 🎨 **Modern UI**: Clean and responsive design
- 💾 **Persistent Login**: Uses AsyncStorage to maintain login state
- 🧭 **Navigation**: Smooth navigation between screens
- 📊 **Dashboard**: User dashboard with profile information and quick actions

## Demo Credentials

For testing the login functionality:
- **Email**: `test@example.com`
- **Password**: `password`

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd AuthApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Web
```bash
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React Context for state management
│   └── AuthContext.tsx # Authentication context
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx # Main navigation structure
├── screens/           # App screens
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   └── DashboardScreen.tsx
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Components

### Authentication Context (`src/context/AuthContext.tsx`)
- Manages user authentication state
- Provides login, register, and logout functions
- Persists user data using AsyncStorage

### Login Screen (`src/screens/LoginScreen.tsx`)
- Email and password input
- Form validation
- Loading states
- Navigation to registration

### Register Screen (`src/screens/RegisterScreen.tsx`)
- Full name, email, and password inputs
- Password confirmation
- Form validation
- Navigation to login

### Dashboard Screen (`src/screens/DashboardScreen.tsx`)
- User profile display
- Statistics cards
- Quick action buttons
- Logout functionality

### App Navigator (`src/navigation/AppNavigator.tsx`)
- Handles authentication flow
- Conditional navigation based on login state
- Loading screen while checking authentication

## Technologies Used

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence
- **React Context**: State management

## Customization

### Styling
All styles are defined using React Native's StyleSheet API. You can customize colors, fonts, and layouts by modifying the style objects in each component.

### Authentication Logic
The authentication logic is currently simulated. To integrate with a real backend:

1. Replace the simulated API calls in `AuthContext.tsx`
2. Update the login and register functions to call your actual API endpoints
3. Handle real authentication tokens and user data

### Adding New Screens
1. Create a new screen component in `src/screens/`
2. Add the screen to the navigation stack in `AppNavigator.tsx`
3. Update the navigation logic as needed

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Try clearing the cache:
   ```bash
   npx expo start --clear
   ```

2. **iOS build issues**: Make sure you have Xcode installed and updated

3. **Android build issues**: Ensure Android Studio and SDK are properly configured

4. **Navigation issues**: Make sure all navigation dependencies are installed:
   ```bash
   npm install @react-navigation/native @react-navigation/stack
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License. 