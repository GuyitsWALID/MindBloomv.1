import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { paymentManager, PaymentPlan, PurchaseResult } from '@/lib/payments';

interface PaymentContextType {
  isInitialized: boolean;
  loading: boolean;
  purchasePlan: (plan: PaymentPlan) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  openManageSubscription: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<{
    isActive: boolean;
    platform: 'web' | 'mobile' | null;
    expirationDate?: string;
  }>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'mindbloom_weekly',
    name: 'Weekly Premium',
    price: 2.99,
    period: 'weekly',
    features: [
      'Unlimited AI Insights & Coaching',
      'Advanced Mood Analytics',
      'Custom Meditation Library',
      'Export Journal Data',
      'Priority Support',
      'Premium Themes & Customization'
    ],
    stripePriceId: 'price_weekly_premium',
    revenueCatPackageId: 'mindbloom_weekly_299',
  },
  {
    id: 'mindbloom_monthly',
    name: 'Monthly Premium',
    price: 9.99,
    period: 'monthly',
    popular: true,
    features: [
      'Unlimited AI Insights & Coaching',
      'Advanced Mood Analytics',
      'Custom Meditation Library',
      'Export Journal Data',
      'Priority Support',
      'Premium Themes & Customization',
      'Detailed Progress Reports',
      'Personalized Wellness Plans'
    ],
    stripePriceId: 'price_monthly_premium',
    revenueCatPackageId: 'mindbloom_monthly_999',
  },
  {
    id: 'mindbloom_yearly',
    name: 'Yearly Premium',
    price: 79.99,
    period: 'yearly',
    savings: 'Save 33% • Best Value',
    features: [
      'Everything in Monthly Premium',
      'AI Wellness Coach (Beta)',
      'Advanced Pattern Recognition',
      'Unlimited Cloud Backup',
      'Family Sharing (up to 4 members)',
      'Exclusive Content Library',
      'Early Access to New Features',
      'Personal Growth Challenges',
      'Mood Prediction Insights',
      'Custom Habit Tracking'
    ],
    stripePriceId: 'price_yearly_premium',
    revenueCatPackageId: 'mindbloom_yearly_7999',
  }
];

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      initializePayments();
    }
  }, [user]);

  const initializePayments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await paymentManager.initialize(user.id);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize payments:', error);
      Alert.alert(
        'Payment Setup Error',
        'Failed to initialize payment system. Some features may not be available.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const purchasePlan = async (plan: PaymentPlan): Promise<PurchaseResult> => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        platform: Platform.OS === 'web' ? 'web' : 'mobile',
      };
    }

    if (!isInitialized) {
      await initializePayments();
    }

    try {
      setLoading(true);
      
      // Show platform-specific information
      if (Platform.OS === 'web') {
        Alert.alert(
          'Redirecting to Stripe',
          'You will be redirected to Stripe to complete your purchase securely.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Continue', 
              onPress: async () => {
                const result = await paymentManager.purchasePlan(plan, user.id, user.email!);
                return result;
              }
            }
          ]
        );
        return { success: false, error: 'User cancelled', platform: 'web' };
      } else {
        // Check if RevenueCat is properly integrated
        Alert.alert(
          'Mobile Purchase',
          'To enable mobile purchases, please export this project and integrate the RevenueCat SDK following the guide at: https://www.revenuecat.com/docs/getting-started/installation/expo\n\nFor now, you can simulate a purchase.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate Purchase', 
              onPress: async () => {
                // Simulate successful purchase
                return {
                  success: true,
                  platform: 'mobile' as const,
                  transactionId: `sim_${Date.now()}`,
                };
              }
            }
          ]
        );
        return { success: false, error: 'User cancelled', platform: 'mobile' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
        platform: Platform.OS === 'web' ? 'web' : 'mobile',
      };
    } finally {
      setLoading(false);
    }
  };

  const restorePurchases = async (): Promise<PurchaseResult> => {
    if (!isInitialized) {
      await initializePayments();
    }

    try {
      setLoading(true);
      return await paymentManager.restorePurchases();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
        platform: Platform.OS === 'web' ? 'web' : 'mobile',
      };
    } finally {
      setLoading(false);
    }
  };

  const openManageSubscription = async (): Promise<void> => {
    await paymentManager.openManageSubscription();
  };

  const checkSubscriptionStatus = async () => {
    if (!user || !isInitialized) {
      return {
        isActive: false,
        platform: null as null,
      };
    }

    return await paymentManager.checkSubscriptionStatus(user.id);
  };

  return (
    <PaymentContext.Provider
      value={{
        isInitialized,
        loading,
        purchasePlan,
        restorePurchases,
        openManageSubscription,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
}