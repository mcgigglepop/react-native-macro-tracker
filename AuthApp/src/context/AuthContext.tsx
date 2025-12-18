import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import CognitoService, { CognitoUserData } from '../services/cognitoService';
// import ApiService from '../services/apiService';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // Check if user is authenticated with Cognito
      const cognitoUser = await CognitoService.getCurrentUser();
      if (cognitoUser) {
        setUser(cognitoUser);
        await AsyncStorage.setItem('user', JSON.stringify(cognitoUser));
      } else {
        // Fallback to local storage
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Login with Cognito
      const userData = await CognitoService.loginUser(email, password);
      
      // Add a small delay to ensure session is properly established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('Login completed, user set in context');
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Register with Cognito
      await CognitoService.registerUser(email, password, name);
      
      // Don't automatically log in - user needs to verify email first
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Logout from Cognito
      await CognitoService.logoutUser();
      
      // Clear local storage
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };


  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 