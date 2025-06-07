import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { CreditCard, Smartphone, Globe } from 'lucide-react-native';

interface PaymentPlatformInfoProps {
  isDark?: boolean;
}

export function PaymentPlatformInfo({ isDark = false }: PaymentPlatformInfoProps) {
  const currentPlatform = Platform.OS;

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        {currentPlatform === 'web' ? (
          <Globe size={20} color="#3B82F6" />
        ) : (
          <Smartphone size={20} color="#10B981" />
        )}
        <Text style={[styles.title, isDark && styles.darkText]}>
          Payment Information
        </Text>
      </View>
      
      <Text style={[styles.description, isDark && styles.darkSubtitle]}>
        {currentPlatform === 'web' 
          ? 'Secure payment processing by Stripe. Your subscription will be managed through our web portal with industry-standard security.'
          : 'Payments are processed through your device\'s App Store. Manage your subscription in your App Store settings for seamless billing.'
        }
      </Text>

      <View style={styles.features}>
        <View style={styles.featureRow}>
          <CreditCard size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
            {currentPlatform === 'web' 
              ? 'Credit/Debit Cards, Apple Pay, Google Pay'
              : 'App Store billing with your existing payment method'
            }
          </Text>
        </View>
        
        <View style={styles.featureRow}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
            7-day free trial • Cancel anytime
          </Text>
        </View>
        
        <View style={styles.featureRow}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
            {currentPlatform === 'web' 
              ? 'PCI DSS compliant secure processing'
              : 'Apple/Google secure payment processing'
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  darkContainer: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
  },
  darkText: {
    color: '#F9FAFB',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  features: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  checkmark: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
});