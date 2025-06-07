import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { usePayments, PAYMENT_PLANS } from './PaymentContext';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan, UserSubscription, SubscriptionContextType } from '@/types/subscription';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Re-export plans from PaymentContext for backward compatibility
export const SUBSCRIPTION_PLANS = PAYMENT_PLANS;

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { purchasePlan: paymentPurchasePlan, restorePurchases: paymentRestorePurchases } = usePayments();
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
        .maybeSingle();
      
      if (error) {
        console.error('Error loading subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchasePlan = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    try {
      const result = await paymentPurchasePlan(plan);
      
      if (result.success) {
        // For successful purchases, create subscription record
        if (user && result.platform === 'mobile') {
          await createSubscriptionRecord(planId, result.platform, result.transactionId);
        }
        
        Alert.alert(
          'Purchase Successful! 🌟',
          `Welcome to ${plan.name}! You now have access to all premium features.`,
          [{ text: 'Get Started', style: 'default' }]
        );
        
        // Reload subscription data
        await loadSubscription();
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Purchase failed' 
      };
    }
  };

  const createSubscriptionRecord = async (
    planId: string, 
    platform: string, 
    transactionId?: string
  ) => {
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
          stripe_subscription_id: platform === 'web' ? transactionId : undefined,
          revenuecat_user_id: platform !== 'web' ? user.id : undefined,
        })
        .select()
        .single();

      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error creating subscription record:', error);
    }
  };

  const restorePurchases = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await paymentRestorePurchases();
      
      if (result.success) {
        await loadSubscription();
        Alert.alert(
          'Purchases Restored',
          'Your subscription has been restored successfully.',
          [{ text: 'OK' }]
        );
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Restore failed' 
      };
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
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel subscription' 
      };
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