export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  mode: 'payment' | 'subscription';
  currency: string;
  interval?: 'week' | 'month' | 'year';
  features?: string[];
  popular?: boolean;
  savings?: string;
  trialDays?: number;
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'premium_weekly',
    name: 'Weekly Premium',
    description: 'Perfect for trying out premium features with weekly flexibility.',
    priceId: 'price_1RXMB0Q2n6yCWINPZ5JCt5PE', // Replace with your actual Stripe weekly price ID
    price: 2.99,
    mode: 'subscription',
    currency: 'usd',
    interval: 'week',
    trialDays: 3,
    features: [
      'Unlimited AI Insights & Coaching',
      'Advanced Mood Analytics',
      'Custom Meditation Library',
      'Export Journal Data',
      'Priority Support',
      'Premium Themes & Customization'
    ]
  },
  {
    id: 'premium_monthly',
    name: 'Monthly Premium',
    description: 'Most flexible option with monthly billing and full premium access.',
    priceId: 'price_1RXMHSQ2n6yCWINPQpJPr6Cs', // Replace with your actual Stripe monthly price ID
    price: 9.99,
    mode: 'subscription',
    currency: 'usd',
    interval: 'month',
    popular: true,
    trialDays: 7,
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
    id: 'premium_yearly',
    name: 'Yearly Premium',
    description: 'Best value with significant savings and all premium features included.',
    priceId: 'price_1RXMB0Q2n6yCWINPzDzueb3c', // Replace with your actual Stripe yearly price ID
    price: 79.99,
    mode: 'subscription',
    currency: 'usd',
    interval: 'year',
    savings: 'Save 33% • Best Value',
    trialDays: 14,
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
      'Custom Habit Tracking',
      'Priority Customer Success Manager',
      'Advanced Export Options'
    ]
  }
];

export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}

export function getAllProducts(): StripeProduct[] {
  return STRIPE_PRODUCTS;
}

export function getPopularProduct(): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.popular);
}

export function calculateSavings(weeklyPrice: number, monthlyPrice: number, yearlyPrice: number) {
  const monthlyVsWeekly = Math.round((1 - (monthlyPrice / (weeklyPrice * 4.33))) * 100);
  const yearlyVsMonthly = Math.round((1 - (yearlyPrice / (monthlyPrice * 12))) * 100);
  const yearlyVsWeekly = Math.round((1 - (yearlyPrice / (weeklyPrice * 52))) * 100);
  
  return {
    monthlyVsWeekly,
    yearlyVsMonthly,
    yearlyVsWeekly
  };
}