import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Crown, CheckCircle, Sparkles, ArrowRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function PremiumSuccessScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { session_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (session_id && user) {
      verifyPurchase();
    } else {
      setLoading(false);
    }
  }, [session_id, user]);

  const verifyPurchase = async () => {
    try {
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if subscription is now active
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status')
        .maybeSingle();
      
      if (!error && data?.subscription_status === 'active') {
        setVerified(true);
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const handleViewPremium = () => {
    router.replace('/(tabs)/premium');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <LinearGradient 
          colors={isDark ? ['#1F2937', '#111827'] : ['#FEF3C7', '#FFFFFF']} 
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Sparkles size={60} color="#F59E0B" />
            <Text style={[styles.loadingText, isDark && styles.darkText]}>
              Verifying your purchase...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient 
        colors={isDark ? ['#1F2937', '#111827'] : ['#FEF3C7', '#FFFFFF']} 
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Crown size={80} color="#F59E0B" />
            <CheckCircle size={40} color="#10B981" style={styles.checkIcon} />
          </View>

          <Text style={[styles.title, isDark && styles.darkText]}>
            Welcome to Premium! 🎉
          </Text>

          <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
            {verified 
              ? 'Your subscription is now active and you have access to all premium features.'
              : 'Your payment was successful! Your premium features will be available shortly.'
            }
          </Text>

          <View style={[styles.featuresCard, isDark && styles.darkCard]}>
            <Text style={[styles.featuresTitle, isDark && styles.darkText]}>
              You now have access to:
            </Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                  Unlimited AI Insights & Coaching
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                  Advanced Mood Analytics
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                  Custom Meditation Library
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                  Priority Support & More
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonText}>Start Your Journey</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, isDark && styles.darkSecondaryButton]} 
              onPress={handleViewPremium}
            >
              <Text style={[styles.secondaryButtonText, isDark && styles.darkSecondaryButtonText]}>
                View Premium Features
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.supportCard, isDark && styles.darkCard]}>
            <Text style={[styles.supportTitle, isDark && styles.darkText]}>
              Need Help?
            </Text>
            <Text style={[styles.supportText, isDark && styles.darkSubtitle]}>
              If you have any questions about your subscription or need assistance, 
              our premium support team is here to help.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3C7',
  },
  darkContainer: {
    backgroundColor: '#1F2937',
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginTop: 24,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  checkIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  darkSecondaryButton: {
    borderColor: '#4B5563',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  darkSecondaryButtonText: {
    color: '#9CA3AF',
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  supportTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  supportText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});