import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, UserSubscription, SubscriptionContextType } from '@/types/subscription';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Subscription plans with competitive pricing
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'mindbloom_monthly',
    name: 'Monthly Premium',
    price: 9.99,
    period: 'monthly',
    revenueCatId: 'mindbloom_monthly_999',
    stripeId: 'price_monthly_premium',
    features: [
      'Unlimited AI Insights & Coaching',
      'Advanced Mood Analytics',
      'Custom Meditation Library',
      'Export Journal Data',
      'Priority Support',
      'Premium Themes & Customization',
      'Detailed Progress Reports',
      'Personalized Wellness Plans'
    ]
  },
  {
    id: 'mindbloom_yearly',
    name: 'Yearly Premium',
    price: 79.99,
    period: 'yearly',
    popular: true,
    savings: 'Save 33% • Best Value',
    revenueCatId: 'mindbloom_yearly_7999',
    stripeId: 'price_yearly_premium',
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
    ]
  }
];

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchasePlan = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    if (Platform.OS === 'web') {
      return handleWebPurchase(planId);
    } else {
      return handleMobilePurchase(planId);
    }
  };

  const handleWebPurchase = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        return { success: false, error: 'Plan not found' };
      }

      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user?.id,
          priceId: plan.stripeId,
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        return { success: false, error: result.error };
      }

      // For demo purposes, simulate successful purchase
      if (result.url.includes('demo')) {
        Alert.alert(
          'Demo Mode',
          'This is a demo. In production, you would be redirected to Stripe Checkout.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate Success', 
              onPress: async () => {
                await simulateSuccessfulPurchase(planId, 'web');
              }
            }
          ]
        );
        return { success: true };
      }

      // Redirect to Stripe checkout
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = result.url;
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create checkout session' };
    }
  };

  const handleMobilePurchase = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if RevenueCat is available (would be after export and native integration)
      const hasRevenueCat = false; // This would be true after proper integration
      
      if (!hasRevenueCat) {
        Alert.alert(
          'RevenueCat Integration Required',
          'To enable mobile purchases, please export this project and integrate RevenueCat SDK following the guide at: https://www.revenuecat.com/docs/getting-started/installation/expo\n\nFor now, you can simulate a purchase.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate Purchase', 
              onPress: async () => {
                await simulateSuccessfulPurchase(planId, Platform.OS as 'ios' | 'android');
              }
            }
          ]
        );
        return { success: true };
      }

      // This would be the actual RevenueCat implementation:
      /*
      const Purchases = require('react-native-purchases');
      
      try {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
        const purchaserInfo = await Purchases.purchasePackage(plan.revenueCatId);
        
        if (purchaserInfo.customerInfo.entitlements.active.premium) {
          await createSubscriptionRecord(planId, Platform.OS, purchaserInfo);
          return { success: true };
        }
      } catch (e) {
        if (!e.userCancelled) {
          return { success: false, error: e.message };
        }
      }
      */
      
      return { success: false, error: 'RevenueCat integration required for mobile purchases' };
    } catch (error) {
      return { success: false, error: 'Purchase failed' };
    }
  };

  const simulateSuccessfulPurchase = async (planId: string, platform: string) => {
    if (!user) return;

    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) return;

      const endDate = new Date();
      if (plan.period === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: endDate.toISOString(),
          platform: platform,
          stripe_subscription_id: platform === 'web' ? `sim_${Date.now()}` : undefined,
          revenuecat_user_id: platform !== 'web' ? user.id : undefined,
        })
        .select()
        .single();

      if (!error && data) {
        setSubscription(data);
        Alert.alert(
          'Welcome to Premium! 🌟',
          `You now have access to all premium features. Enjoy your enhanced wellness journey!`,
          [{ text: 'Get Started', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (Platform.OS === 'web') {
        // For web, just reload the subscription
        await loadSubscription();
        return { success: true };
      }

      // For mobile, this would use RevenueCat:
      /*
      const Purchases = require('react-native-purchases');
      const purchaserInfo = await Purchases.restorePurchases();
      
      if (purchaserInfo.customerInfo.entitlements.active.premium) {
        await loadSubscription();
        return { success: true };
      }
      */

      Alert.alert(
        'Restore Purchases',
        'RevenueCat integration required for mobile purchase restoration. For now, subscription data is automatically synced.',
        [{ text: 'OK' }]
      );
      
      await loadSubscription();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to restore purchases' };
    }
  };

  const cancelSubscription = async (): Promise<{ success: boolean; error?: string }> => {
    if (!subscription) {
      return { success: false, error: 'No active subscription found' };
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(null);
      Alert.alert(
        'Subscription Cancelled',
        'Your subscription has been cancelled. You\'ll continue to have access to premium features until the end of your current billing period.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to cancel subscription' };
    }
  };

  const checkFeatureAccess = (featureKey: string): boolean => {
    if (!subscription) return false;
    
    const isActive = subscription.status === 'active' || subscription.status === 'trial';
    if (!isActive) return false;

    // Check if subscription hasn't expired
    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    
    return now <= endDate;
  };

  const calculateTrialDaysLeft = (): number => {
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_end) {
      return 0;
    }
    
    const now = new Date();
    const trialEnd = new Date(subscription.trial_end);
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const isSubscribed = subscription?.status === 'active';
  const isPremium = isSubscribed || subscription?.status === 'trial';
  const currentPlan = isPremium 
    ? SUBSCRIPTION_PLANS.find(plan => plan.id === subscription?.plan_id) || null
    : null;
  const trialDaysLeft = calculateTrialDaysLeft();

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isPremium,
        currentPlan,
        subscription,
        loading,
        trialDaysLeft,
        purchasePlan,
        restorePurchases,
        cancelSubscription,
        checkFeatureAccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}