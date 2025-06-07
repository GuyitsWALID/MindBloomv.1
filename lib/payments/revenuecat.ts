import { Platform, Alert } from 'react-native';

export interface RevenueCatConfig {
  apiKey: string;
  userId?: string;
}

export interface PurchasePackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    description: string;
    title: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
}

export interface CustomerInfo {
  originalAppUserId: string;
  entitlements: {
    active: Record<string, any>;
    all: Record<string, any>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  nonSubscriptionTransactions: any[];
  firstSeen: string;
  originalPurchaseDate?: string;
  requestDate: string;
  latestExpirationDate?: string;
  originalApplicationVersion?: string;
  managementURL?: string;
}

export interface PurchaseResult {
  customerInfo: CustomerInfo;
  productIdentifier: string;
  transaction: any;
}

export class RevenueCatService {
  private isInitialized = false;
  private config: RevenueCatConfig;

  constructor(config: RevenueCatConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('RevenueCat is not available on web platform');
      return;
    }

    try {
      // This would be the actual RevenueCat initialization
      // const Purchases = require('react-native-purchases');
      
      // await Purchases.configure({
      //   apiKey: this.config.apiKey,
      //   appUserID: this.config.userId,
      // });

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasePackage[]> {
    if (Platform.OS === 'web') {
      throw new Error('RevenueCat is not available on web platform');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // This would be the actual RevenueCat implementation
      // const Purchases = require('react-native-purchases');
      // const offerings = await Purchases.getOfferings();
      
      // Mock data for development
      return [
        {
          identifier: 'mindbloom_monthly',
          packageType: 'monthly',
          product: {
            identifier: 'mindbloom_monthly_999',
            description: 'Monthly Premium Subscription',
            title: 'Mindbloom Premium Monthly',
            price: 9.99,
            priceString: '$9.99',
            currencyCode: 'USD',
          },
        },
        {
          identifier: 'mindbloom_yearly',
          packageType: 'annual',
          product: {
            identifier: 'mindbloom_yearly_7999',
            description: 'Yearly Premium Subscription',
            title: 'Mindbloom Premium Yearly',
            price: 79.99,
            priceString: '$79.99',
            currencyCode: 'USD',
          },
        },
      ];
    } catch (error) {
      console.error('Error fetching RevenueCat offerings:', error);
      throw error;
    }
  }

  async purchasePackage(packageIdentifier: string): Promise<PurchaseResult> {
    if (Platform.OS === 'web') {
      throw new Error('RevenueCat purchases are not available on web platform');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // This would be the actual RevenueCat implementation
      // const Purchases = require('react-native-purchases');
      // const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageIdentifier);
      
      // Mock successful purchase for development
      const mockResult: PurchaseResult = {
        customerInfo: {
          originalAppUserId: this.config.userId || 'user_123',
          entitlements: {
            active: { premium: {} },
            all: { premium: {} },
          },
          activeSubscriptions: [packageIdentifier],
          allPurchasedProductIdentifiers: [packageIdentifier],
          nonSubscriptionTransactions: [],
          firstSeen: new Date().toISOString(),
          requestDate: new Date().toISOString(),
        },
        productIdentifier: packageIdentifier,
        transaction: {},
      };

      return mockResult;
    } catch (error) {
      console.error('Error purchasing package:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    if (Platform.OS === 'web') {
      throw new Error('RevenueCat restore is not available on web platform');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // This would be the actual RevenueCat implementation
      // const Purchases = require('react-native-purchases');
      // const customerInfo = await Purchases.restorePurchases();
      
      // Mock customer info for development
      const mockCustomerInfo: CustomerInfo = {
        originalAppUserId: this.config.userId || 'user_123',
        entitlements: {
          active: {},
          all: {},
        },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        nonSubscriptionTransactions: [],
        firstSeen: new Date().toISOString(),
        requestDate: new Date().toISOString(),
      };

      return mockCustomerInfo;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    if (Platform.OS === 'web') {
      throw new Error('RevenueCat customer info is not available on web platform');
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // This would be the actual RevenueCat implementation
      // const Purchases = require('react-native-purchases');
      // const customerInfo = await Purchases.getCustomerInfo();
      
      // Mock customer info for development
      const mockCustomerInfo: CustomerInfo = {
        originalAppUserId: this.config.userId || 'user_123',
        entitlements: {
          active: {},
          all: {},
        },
        activeSubscriptions: [],
        allPurchasedProductIdentifiers: [],
        nonSubscriptionTransactions: [],
        firstSeen: new Date().toISOString(),
        requestDate: new Date().toISOString(),
      };

      return mockCustomerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      throw error;
    }
  }

  async setUserId(userId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      // This would be the actual RevenueCat implementation
      // const Purchases = require('react-native-purchases');
      // await Purchases.logIn(userId);
      
      this.config.userId = userId;
      console.log('RevenueCat user ID set:', userId);
    } catch (error) {
      console.error('Error setting RevenueCat user ID:', error);
      throw error;
    }
  }

  async logOut(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      // This would be the actual RevenueCat implementation
      // const Purchases = require('react-native-purchases');
      // await Purchases.logOut();
      
      this.config.userId = undefined;
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('Error logging out from RevenueCat:', error);
      throw error;
    }
  }
}

// Singleton instance
export const revenueCatService = new RevenueCatService({
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',
});