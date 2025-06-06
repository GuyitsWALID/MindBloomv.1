export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  savings?: string;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'analytics' | 'ai' | 'content' | 'customization' | 'export';
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionContextType {
  isSubscribed: boolean;
  isPremium: boolean;
  currentPlan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  loading: boolean;
  purchasePlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  cancelSubscription: () => Promise<{ success: boolean; error?: string }>;
}