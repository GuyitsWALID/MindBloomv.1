export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  mode: 'payment' | 'subscription';
  currency: string;
  interval?: 'month' | 'year';
  features?: string[];
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'premium',
    name: 'Premium Subscription',
    description: 'Unlock all premium features including unlimited AI insights, advanced analytics, custom meditations, and priority support.',
    priceId: 'price_1RXLpQQ2n6yCWINPaHj0O93B',
    price: 7.00,
    mode: 'subscription',
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited AI Insights & Coaching',
      'Advanced Mood Analytics',
      'Custom Meditation Library',
      'Export Journal Data',
      'Priority Support',
      'Premium Themes & Customization',
      'Detailed Progress Reports',
      'Personalized Wellness Plans',
      'AI Wellness Coach (Beta)',
      'Advanced Pattern Recognition',
      'Mood Prediction Insights'
    ]
  }
];

export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === id);
}

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}