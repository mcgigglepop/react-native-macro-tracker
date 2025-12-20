import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService from '../services/apiService';

interface SubscriptionContextType {
  accountType: 'basic' | 'premium' | null;
  isLoading: boolean;
  isPremium: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [accountType, setAccountType] = useState<'basic' | 'premium' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      setIsLoading(true);
      const userInfo = await ApiService.getUserInfo();
      const accountTypeValue = (userInfo?.accountType as 'basic' | 'premium') || 'basic';
      setAccountType(accountTypeValue);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      // Default to basic on error - this is safer than blocking the app
      setAccountType('basic');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  const value: SubscriptionContextType = {
    accountType,
    isLoading,
    isPremium: accountType === 'premium',
    refreshSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

