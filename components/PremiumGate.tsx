import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, Lock, Sparkles } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

interface PremiumGateProps {
  feature: string;
  description: string;
  children?: React.ReactNode;
  showUpgrade?: boolean;
}

export function PremiumGate({ feature, description, children, showUpgrade = true }: PremiumGateProps) {
  const { isPremium, checkFeatureAccess } = useSubscription();
  const { isDark } = useTheme();

  // Check if user has access to this specific feature
  const hasAccess = isPremium && checkFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.lockIcon, isDark && styles.darkLockIcon]}>
        <Lock size={32} color="#F59E0B" />
      </View>
      
      <Text style={[styles.title, isDark && styles.darkText]}>
        Premium Feature
      </Text>
      
      <Text style={[styles.feature, isDark && styles.darkText]}>
        {feature}
      </Text>
      
      <Text style={[styles.description, isDark && styles.darkSubtitle]}>
        {description}
      </Text>
      
      {showUpgrade && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => router.push('/(tabs)/premium')}
        >
          <Crown size={20} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          <Sparkles size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={[styles.previewContainer, isDark && styles.darkPreviewContainer]}>
        <Text style={[styles.previewText, isDark && styles.darkPreviewText]}>
          Preview available in premium
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    margin: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FEF3C7',
  },
  darkContainer: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  darkLockIcon: {
    backgroundColor: '#4B5563',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  darkText: {
    color: '#F9FAFB',
  },
  feature: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginHorizontal: 8,
  },
  previewContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  darkPreviewContainer: {
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
  },
  previewText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkPreviewText: {
    color: '#9CA3AF',
  },
});