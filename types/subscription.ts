export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  savings?: string;
  revenueCatId?: string; // For mobile purchases
  stripeId?: string; // For web purchases
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'analytics' | 'ai' | 'content' | 'customization' | 'export' | 'coaching';
  enabled: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  revenuecat_user_id?: string;
  platform: 'web' | 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

export interface SubscriptionContextType {
  isSubscribed: boolean;
  isPremium: boolean;
  currentPlan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  loading: boolean;
  trialDaysLeft: number;
  purchasePlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
  checkFeatureAccess: (featureKey: string) => boolean;
}

export interface PaymentProvider {
  initialize: () => Promise<void>;
  purchasePackage: (packageId: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  getCustomerInfo: () => Promise<any>;
}