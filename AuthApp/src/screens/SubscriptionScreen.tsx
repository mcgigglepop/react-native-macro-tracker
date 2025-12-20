import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSubscription } from '../context/SubscriptionContext';

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
}

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
  const { isPremium, accountType, isLoading } = useSubscription();
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = async (planId: string) => {
    // TODO: Integrate with Expo IAP
    // For now, show a placeholder alert
    setProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Alert.alert(
      'Coming Soon',
      `Subscription purchase for ${planId} will be available soon. This will be integrated with Apple In-App Purchases.`,
      [{ text: 'OK', onPress: () => setProcessing(false) }]
    );
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
            
            {SUBSCRIPTION_PLANS.map((plan) => (
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
});

export default SubscriptionScreen;

