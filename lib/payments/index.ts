import { Platform, Alert } from 'react-native';
import { stripeService } from './stripe';
import { revenueCatService } from './revenuecat';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  savings?: string;
  stripePriceId?: string;
  revenueCatPackageId?: string;
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  platform: 'web' | 'mobile';
  transactionId?: string;
}

export class PaymentManager {
  private isInitialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS !== 'web' && userId) {
        await revenueCatService.setUserId(userId);
        await revenueCatService.initialize();
      }
      
      this.isInitialized = true;
      console.log('Payment manager initialized');
    } catch (error) {
      console.error('Failed to initialize payment manager:', error);
      throw error;
    }
  }

  async purchasePlan(
    plan: PaymentPlan,
    userId: string,
    userEmail: string
  ): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      await this.initialize(userId);
    }

    try {
      if (Platform.OS === 'web') {
        return await this.handleWebPurchase(plan, userId, userEmail);
      } else {
        return await this.handleMobilePurchase(plan, userId);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
        platform: Platform.OS === 'web' ? 'web' : 'mobile',
      };
    }
  }

  private async handleWebPurchase(
    plan: PaymentPlan,
    userId: string,
    userEmail: string
  ): Promise<PurchaseResult> {
    try {
      if (!plan.stripePriceId) {
        throw new Error('Stripe price ID not configured for this plan');
      }

      const session = await stripeService.createCheckoutSession({
        planId: plan.id,
        userId,
        userEmail,
      });

      await stripeService.redirectToCheckout(session.url);

      return {
        success: true,
        platform: 'web',
        transactionId: session.sessionId,
      };
    } catch (error) {
      throw new Error(`Web purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleMobilePurchase(
    plan: PaymentPlan,
    userId: string
  ): Promise<PurchaseResult> {
    try {
      if (!plan.revenueCatPackageId) {
        throw new Error('RevenueCat package ID not configured for this plan');
      }

      const result = await revenueCatService.purchasePackage(plan.revenueCatPackageId);

      return {
        success: true,
        platform: 'mobile',
        transactionId: result.productIdentifier,
      };
    } catch (error) {
      throw new Error(`Mobile purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    if (!this.isInitialized) {
      throw new Error('Payment manager not initialized');
    }

    try {
      if (Platform.OS === 'web') {
        // For web, we don't need to restore purchases as Stripe handles this
        return {
          success: true,
          platform: 'web',
        };
      } else {
        const customerInfo = await revenueCatService.restorePurchases();
        
        return {
          success: true,
          platform: 'mobile',
          transactionId: customerInfo.originalAppUserId,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
        platform: Platform.OS === 'web' ? 'web' : 'mobile',
      };
    }
  }

  async openManageSubscription(): Promise<void> {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, please visit the Stripe Customer Portal.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Portal', 
            onPress: () => {
              // This would open the Stripe customer portal
              console.log('Opening Stripe customer portal...');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, please visit your device\'s App Store settings.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  }

  async checkSubscriptionStatus(userId: string): Promise<{
    isActive: boolean;
    platform: 'web' | 'mobile' | null;
    expirationDate?: string;
  }> {
    try {
      if (Platform.OS !== 'web') {
        const customerInfo = await revenueCatService.getCustomerInfo();
        const hasActiveEntitlements = Object.keys(customerInfo.entitlements.active).length > 0;
        
        return {
          isActive: hasActiveEntitlements,
          platform: 'mobile',
          expirationDate: customerInfo.latestExpirationDate,
        };
      } else {
        // For web, check subscription status via your backend/Supabase
        return {
          isActive: false,
          platform: 'web',
        };
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return {
        isActive: false,
        platform: null,
      };
    }
  }

  async logout(): Promise<void> {
    if (Platform.OS !== 'web') {
      await revenueCatService.logOut();
    }
    this.isInitialized = false;
  }
}

// Singleton instance
export const paymentManager = new PaymentManager();

// Export services for direct access if needed
export { stripeService, revenueCatService };