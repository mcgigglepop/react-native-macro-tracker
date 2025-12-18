import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FoodLogScreen from '../screens/FoodLogScreen';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Cleanup function to prevent animation warnings
  useEffect(() => {
    return () => {
      // This will run when the component unmounts
      // Helps clean up any lingering animation listeners
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer
      onStateChange={(state) => {
        // Optional: Log navigation state changes for debugging
        console.log('Navigation state changed:', state?.routes?.map(r => r.name));
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          // Disable animations to prevent the warning
          animationEnabled: false,
          // Alternative: Use simpler animations
          // cardStyleInterpolator: ({ current, layouts }) => {
          //   return {
          //     cardStyle: {
          //       transform: [
          //         {
          //           translateX: current.progress.interpolate({
          //             inputRange: [0, 1],
          //             outputRange: [layouts.screen.width, 0],
          //           }),
          //         },
          //       ],
          //     },
          //   };
          // },
        }}
      >
        {user ? (
          // Authenticated stack
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{
                animationEnabled: false,
              }}
            />
            <Stack.Screen 
              name="FoodLog" 
              component={FoodLogScreen}
              options={{
                animationEnabled: false,
              }}
            />
          </>
        ) : (
          // Auth stack
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                animationEnabled: false,
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                animationEnabled: false,
              }}
            />
            <Stack.Screen 
              name="EmailVerification" 
              component={EmailVerificationScreen}
              options={{
                animationEnabled: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppNavigator; 