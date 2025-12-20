/**
 * SubscriptionScreen - Handles in-app purchases for premium subscriptions
 * 
 * IMPORTANT SETUP NOTES:
 * 1. Install package: npx expo install expo-in-app-purchases
 * 2. Configure products in App Store Connect with matching PRODUCT_IDS
 * 3. Implement backend endpoint to verify receipts with Apple
 * 4. Update PRODUCT_IDS with your actual product IDs from App Store Connect
 * 
 * For testing:
 * - IAP only works on real devices, not simulators
 * - Use sandbox test accounts for testing purchases
 * - Products must be approved in App Store Connect before testing
 */

/**
 * SubscriptionScreen - Handles in-app purchases for premium subscriptions
 * 
 * IMPORTANT SETUP NOTES:
 * 1. Install package: npx expo install expo-in-app-purchases
 * 2. Configure products in App Store Connect with matching PRODUCT_IDS
 * 3. Implement backend endpoint to verify receipts with Apple
 * 4. Update PRODUCT_IDS with your actual product IDs from App Store Connect
 * 
 * For testing:
 * - IAP only works on real devices, not simulators
 * - Use sandbox test accounts for testing purchases
 * - Products must be approved in App Store Connect before testing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { useSubscription } from '../context/SubscriptionContext';
import ApiService from '../services/apiService';

interface SubscriptionScreenProps {
  navigation: any;
}

interface SubscriptionPlan {
  id: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  price: string;
  period: string;
  originalPrice?: string;
  savings?: string;
  popular?: boolean;
  description: string;
  productId?: string; // Store product ID from IAP
}

// Map plan IDs to product IDs (SKUs) - These must match your App Store Connect product IDs
// TODO: Replace these with your actual product IDs from App Store Connect
// Format should be: com.yourcompany.appname.productname
const PRODUCT_IDS: Record<string, string> = {
  monthly: 'com.yourcompany.macrotracker.monthly',
  yearly: 'com.yourcompany.macrotracker.yearly',
  lifetime: 'com.yourcompany.macrotracker.lifetime',
};

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '$9.99',
    period: 'per month',
    description: 'Full access to all premium features',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '$59.99',
    period: 'per year',
    originalPrice: '$119.88',
    savings: 'Save 50%',
    popular: true,
    description: 'Best value - Save 50% compared to monthly',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '$149.99',
    period: 'one-time payment',
    description: 'Unlimited access forever - no recurring charges',
  },
];

const PREMIUM_FEATURES = [
  'Unlimited history access',
  '7-day rolling averages',
  'Centered week averages',
  '7-day rolling totals',
  'Advanced analytics & trends',
  'Export your data',
  'Priority support',
];

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  const { isPremium, accountType, isLoading, refreshSubscription } = useSubscription();
  const [processing, setProcessing] = useState(false);
  const [iapConnected, setIapConnected] = useState(false);
  const [products, setProducts] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Initialize IAP connection and fetch products
  useEffect(() => {
    initializeIAP();
    
    // Set up purchase listener
    const purchaseUpdateSubscription = InAppPurchases.setPurchaseListener(({ response, errorCode, results, errorMessage }) => {
      if (response === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach((purchase) => {
          if (purchase.acknowledged) {
            // Purchase already acknowledged, skip
            return;
          }
          
          // Handle the purchase
          handlePurchaseSuccess(purchase);
        });
      } else if (response === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        setProcessing(false);
        Alert.alert('Purchase Cancelled', 'You cancelled the purchase.');
      } else {
        setProcessing(false);
        Alert.alert('Purchase Error', errorMessage || 'An error occurred during the purchase.');
      }
    });

    return () => {
      // Cleanup
      purchaseUpdateSubscription.remove();
      disconnectIAP();
    };
  }, []);

  const initializeIAP = async () => {
    try {
      setLoadingProducts(true);
      
      // Connect to IAP service
      await InAppPurchases.connectAsync();
      setIapConnected(true);
      
      // Fetch products
      const productIds = Object.values(PRODUCT_IDS);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        // Map IAP products to our plan structure
        const updatedPlans = SUBSCRIPTION_PLANS.map(plan => {
          const productId = PRODUCT_IDS[plan.id];
          const iapProduct = results.find(p => p.productId === productId);
          
          if (iapProduct) {
            return {
              ...plan,
              productId: iapProduct.productId,
              price: iapProduct.price, // Use actual price from IAP
            };
          }
          return plan;
        });
        
        setProducts(updatedPlans);
      } else {
        console.warn('Failed to fetch products:', responseCode);
        // Keep default products if fetch fails (for development/testing)
      }
    } catch (error) {
      console.error('Error initializing IAP:', error);
      // IAP might not be available in development, keep default products
      Alert.alert(
        'IAP Not Available',
        'In-App Purchases are only available on real devices with proper App Store configuration. Using placeholder prices for development.'
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const disconnectIAP = async () => {
    try {
      if (iapConnected) {
        await InAppPurchases.disconnectAsync();
        setIapConnected(false);
      }
    } catch (error) {
      console.error('Error disconnecting IAP:', error);
    }
  };

  const handlePurchaseSuccess = async (purchase: InAppPurchases.InAppPurchase) => {
    try {
      console.log('Purchase successful:', purchase);
      
      // Verify purchase receipt on backend
      // This is CRITICAL for security - never trust client-side purchase data alone!
      try {
        await ApiService.verifyPurchase(
          purchase.receipt, // Base64 encoded receipt
          purchase.productId, // Product ID that was purchased
          purchase.orderId || purchase.transactionId || '', // Transaction ID
        );
        
        // Only finish transaction after successful backend verification
        await InAppPurchases.finishTransactionAsync(purchase, false);
        
        // Refresh subscription status to reflect the upgrade
        await refreshSubscription();
        
        setProcessing(false);
        
        Alert.alert(
          'Purchase Successful!',
          'Your subscription has been activated. Thank you for upgrading to Premium!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to previous screen
                navigation.goBack();
              }
            }
          ]
        );
      } catch (backendError: any) {
        console.error('Backend verification error:', backendError);
        setProcessing(false);
        
        // Don't finish transaction if backend verification fails
        // The transaction will remain pending and can be retried
        
        Alert.alert(
          'Verification Failed',
          backendError?.message || 'Failed to verify purchase with server. Please contact support if this issue persists.',
          [
            {
              text: 'OK',
              // Transaction remains pending, user can retry later
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      setProcessing(false);
      Alert.alert('Error', 'Failed to process purchase. Please contact support.');
    }
  };

  const handleSubscribe = async (planId: string) => {
    const productId = PRODUCT_IDS[planId];
    
    if (!productId) {
      Alert.alert('Error', 'Product ID not found for this plan.');
      return;
    }

    if (!iapConnected) {
      Alert.alert(
        'IAP Not Available',
        'In-App Purchases are not available. Please ensure you are on a real device with proper App Store configuration.'
      );
      return;
    }

    try {
      setProcessing(true);
      
      // Request purchase
      await InAppPurchases.purchaseItemAsync(productId);
      
      // Purchase result will be handled by the purchase listener
      // Don't set processing to false here - let the listener handle it
    } catch (error: any) {
      console.error('Error initiating purchase:', error);
      setProcessing(false);
      
      if (error.code === 'E_USER_CANCELLED') {
        Alert.alert('Purchase Cancelled', 'You cancelled the purchase.');
      } else {
        Alert.alert('Purchase Error', error.message || 'Failed to initiate purchase. Please try again.');
      }
    }
  };

  const handleManageSubscription = () => {
    // TODO: Integrate with subscription management
    Alert.alert(
      'Manage Subscription',
      'Subscription management will be available soon. You can manage your subscription through your Apple ID settings.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Subscription</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Plan</Text>
          <View style={styles.statusContent}>
            <View style={[
              styles.statusBadge,
              isPremium ? styles.statusBadgePremium : styles.statusBadgeBasic
            ]}>
              <Text style={styles.statusBadgeText}>
                {isPremium ? 'Premium' : 'Basic (Free)'}
              </Text>
            </View>
            {isPremium && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSubscription}
              >
                <Text style={styles.manageButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Premium Features */}
        {!isPremium && (
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Premium Features</Text>
            <View style={styles.featuresList}>
              {PREMIUM_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Subscription Plans */}
        {!isPremium && (
          <View style={styles.plansSection}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            <Text style={styles.plansSubtitle}>Upgrade to unlock all features</Text>
            
            {loadingProducts && (
              <View style={styles.loadingProductsContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingProductsText}>Loading subscription plans...</Text>
              </View>
            )}
            
            {products.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.popular && styles.planCardPopular
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={processing}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  {plan.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>

                {plan.originalPrice && (
                  <Text style={styles.originalPrice}>{plan.originalPrice}/year</Text>
                )}

                <Text style={styles.planDescription}>{plan.description}</Text>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    plan.popular && styles.subscribeButtonPopular,
                    processing && styles.subscribeButtonDisabled
                  ]}
                  onPress={() => handleSubscribe(plan.id)}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>
                      {plan.id === 'lifetime' ? 'Get Lifetime' : 'Subscribe'}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Premium User Message */}
        {isPremium && (
          <View style={styles.premiumMessageCard}>
            <Text style={styles.premiumMessageTitle}>You're All Set! 🎉</Text>
            <Text style={styles.premiumMessageText}>
              You have full access to all premium features. Thank you for your subscription!
            </Text>
          </View>
        )}

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Subscriptions will be charged to your Apple ID account. You can manage or cancel your subscription in your Apple ID settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeBasic: {
    backgroundColor: '#E3F2FD',
  },
  statusBadgePremium: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  manageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  manageButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  featuresCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  plansSection: {
    marginBottom: 20,
  },
  plansTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  plansSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardPopular: {
    borderColor: '#007AFF',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 8,
  },
  planPeriod: {
    fontSize: 16,
    color: '#666',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonPopular: {
    backgroundColor: '#0051D5',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumMessageCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  premiumMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  premiumMessageText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingProductsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingProductsText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
});

export default SubscriptionScreen;

