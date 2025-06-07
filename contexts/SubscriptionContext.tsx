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
    features: [
      'Unlimited AI Insights',
      'Advanced Analytics',
      'Custom Meditation Sessions',
      'Export Journal Data',
      'Priority Support',
      'Dark Mode Themes',
      'Mood Pattern Analysis'
    ]
  },
  {
    id: 'mindbloom_yearly',
    name: 'Yearly Premium',
    price: 79.99,
    period: 'yearly',
    popular: true,
    savings: 'Save 33%',
    features: [
      'Everything in Monthly',
      'Personalized Wellness Plans',
      'Advanced Garden Features',
      'Unlimited Cloud Backup',
      'Family Sharing (up to 4)',
      'Exclusive Content Library',
      'Personal Wellness Coach'
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
        .eq('status', 'active')
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
      // For web, redirect to Stripe checkout
      return handleWebPurchase(planId);
    } else {
      // For mobile, use RevenueCat
      return handleMobilePurchase(planId);
    }
  };

  const handleWebPurchase = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user?.id,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) {
        return { success: false, error };
      }

      // Redirect to Stripe checkout
      window.location.href = url;
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to create checkout session' };
    }
  };

  const handleMobilePurchase = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Note: This would require RevenueCat SDK integration
      // For now, we'll simulate the purchase flow
      Alert.alert(
        'RevenueCat Integration Required',
        'To enable mobile purchases, please export this project and integrate RevenueCat SDK following the guide at: https://www.revenuecat.com/docs/getting-started/installation/expo',
        [{ text: 'OK' }]
      );
      
      return { success: false, error: 'RevenueCat integration required for mobile purchases' };
    } catch (error) {
      return { success: false, error: 'Purchase failed' };
    }
  };

  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Restore purchases logic would go here
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
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to cancel subscription' };
    }
  };

  const isSubscribed = subscription?.status === 'active';
  const isPremium = isSubscribed || subscription?.status === 'trial';
  const currentPlan = isPremium 
    ? SUBSCRIPTION_PLANS.find(plan => plan.id === subscription?.plan_id) || null
    : null;

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isPremium,
        currentPlan,
        subscription,
        loading,
        purchasePlan,
        restorePurchases,
        cancelSubscription,
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