import { Platform } from 'react-native';

export interface StripeCheckoutSession {
  url: string;
  sessionId: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey?: string; // Only used server-side
}

export class StripePaymentService {
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  async createCheckoutSession(params: {
    planId: string;
    userId: string;
    userEmail: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<StripeCheckoutSession> {
    const { planId, userId, userEmail, successUrl, cancelUrl } = params;

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId,
          userEmail,
          successUrl: successUrl || `${window.location.origin}/premium/success`,
          cancelUrl: cancelUrl || `${window.location.origin}/premium`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return {
        url: result.url,
        sessionId: result.sessionId,
      };
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw error;
    }
  }

  async redirectToCheckout(sessionUrl: string): Promise<void> {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = sessionUrl;
    } else {
      throw new Error('Stripe checkout is only available on web platform');
    }
  }

  async createPortalSession(customerId: string): Promise<{ url: string }> {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Stripe portal session:', error);
      throw error;
    }
  }
}

// Singleton instance
export const stripeService = new StripePaymentService({
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
});