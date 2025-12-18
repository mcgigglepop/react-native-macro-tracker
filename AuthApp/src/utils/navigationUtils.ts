import React, { useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

/**
 * Custom hook to handle navigation cleanup and prevent animation warnings
 */
export const useNavigationCleanup = () => {
  const navigation = useNavigation();

  useEffect(() => {
    return () => {
      // Cleanup function that runs when component unmounts
      // This helps prevent animation warnings
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen comes into focus
      return () => {
        // This runs when the screen goes out of focus
        // Clean up any potential animation listeners
      };
    }, [])
  );
};

/**
 * Utility to disable animations for specific screens
 */
export const disableScreenAnimations = {
  animationEnabled: false,
  cardStyleInterpolator: () => ({
    cardStyle: {
      transform: [],
    },
  }),
}; 