import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Check, Star, Brain, ChartBar as BarChart3, Download, Palette, Heart, Shield, Users, BookOpen, Zap, Clock, Target, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { STRIPE_PRODUCTS, getProductById } from '@/src/stripe-config';

interface SubscriptionData {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export default function PremiumScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();
      
      if (error) {
        console.error('Error loading subscription:', error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to purchase premium');
      return;
    }

    setPurchasing(true);
    
    try {
      const premiumProduct = getProductById('premium');
      if (!premiumProduct) {
        throw new Error('Premium product not found');
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: premiumProduct.priceId,
          mode: premiumProduct.mode,
          success_url: `${window.location.origin}/premium/success`,
          cancel_url: `${window.location.origin}/premium`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const openManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'To manage your subscription, please contact our support team or visit the Stripe customer portal.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const isSubscribed = subscription?.subscription_status === 'active' || subscription?.subscription_status === 'trialing';
  const premiumProduct = getProductById('premium');

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading subscription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isSubscribed) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <LinearGradient 
          colors={isDark ? ['#1F2937', '#111827'] : ['#FEF3C7', '#FFFFFF']} 
          style={styles.gradient}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Crown size={60} color="#F59E0B" />
              <Text style={[styles.title, isDark && styles.darkText]}>You're Premium! 👑</Text>
              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
                Enjoying all the exclusive features of Mindbloom Premium
              </Text>
            </View>

            <View style={[styles.currentPlanCard, isDark && styles.darkCard]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planName, isDark && styles.darkText]}>
                  {premiumProduct?.name || 'Premium Plan'}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>${premiumProduct?.price || 7.00}</Text>
                  <Text style={[styles.period, isDark && styles.darkSubtitle]}>
                    /{premiumProduct?.interval || 'month'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.planStatus, isDark && styles.darkSubtitle]}>
                {subscription?.subscription_status === 'trialing' ? 'Free Trial' : 'Active'} • 
                {subscription?.cancel_at_period_end ? ' Cancels at period end' : ' Renews automatically'}
              </Text>
              {subscription?.current_period_end && (
                <Text style={[styles.platformInfo, isDark && styles.darkSubtitle]}>
                  Next billing: {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                </Text>
              )}
            </View>

            <View style={styles.featuresSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Your Premium Features</Text>
              <View style={styles.featuresGrid}>
                {premiumProduct?.features?.map((feature, index) => (
                  <View key={index} style={[styles.featureCard, isDark && styles.darkCard]}>
                    <View style={styles.featureIcon}>
                      <Check size={24} color="#10B981" />
                    </View>
                    <Text style={[styles.featureName, isDark && styles.darkText]}>
                      {feature}
                    </Text>
                  </View>
                )) || []}
              </View>
            </View>

            <View style={[styles.managementCard, isDark && styles.darkCard]}>
              <Text style={[styles.managementTitle, isDark && styles.darkText]}>
                Manage Subscription
              </Text>
              <Text style={[styles.managementText, isDark && styles.darkSubtitle]}>
                Manage your subscription, update payment methods, or view billing history.
              </Text>
              <TouchableOpacity 
                style={[styles.manageButton, isDark && styles.darkManageButton]}
                onPress={openManageSubscription}
              >
                <Text style={[styles.manageButtonText, isDark && styles.darkManageButtonText]}>
                  Manage Subscription
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Crown size={60} color="#F59E0B" />
            <Text style={[styles.title, isDark && styles.darkText]}>Unlock Premium</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              Transform your wellness journey with advanced AI coaching
            </Text>
          </View>

          {/* Value Proposition */}
          <View style={[styles.valueCard, isDark && styles.darkCard]}>
            <Text style={[styles.valueTitle, isDark && styles.darkText]}>Why Premium?</Text>
            <View style={styles.valuePoints}>
              <View style={styles.valuePoint}>
                <Brain size={20} color="#F59E0B" />
                <Text style={[styles.valueText, isDark && styles.darkSubtitle]}>
                  AI-powered insights that adapt to your unique patterns
                </Text>
              </View>
              <View style={styles.valuePoint}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={[styles.valueText, isDark && styles.darkSubtitle]}>
                  Predictive analytics to prevent difficult days
                </Text>
              </View>
              <View style={styles.valuePoint}>
                <Heart size={20} color="#EF4444" />
                <Text style={[styles.valueText, isDark && styles.darkSubtitle]}>
                  Personalized meditation and wellness programs
                </Text>
              </View>
            </View>
          </View>

          {/* Premium Plan */}
          {premiumProduct && (
            <View style={styles.plansSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Premium Plan</Text>
              
              <View style={[styles.planCard, isDark && styles.darkCard, styles.popularPlan]}>
                <View style={styles.popularBadge}>
                  <Star size={16} color="#FFFFFF" />
                  <Text style={styles.popularText}>Most Popular</Text>
                </View>
                
                <View style={styles.planContent}>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, isDark && styles.darkText]}>{premiumProduct.name}</Text>
                    <Text style={[styles.planDescription, isDark && styles.darkSubtitle]}>
                      {premiumProduct.description}
                    </Text>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>${premiumProduct.price}</Text>
                    <Text style={[styles.period, isDark && styles.darkSubtitle]}>
                      /{premiumProduct.interval}
                    </Text>
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {premiumProduct.features?.slice(0, 6).map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check size={16} color="#10B981" />
                      <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                        {feature}
                      </Text>
                    </View>
                  )) || []}
                  {(premiumProduct.features?.length || 0) > 6 && (
                    <Text style={[styles.moreFeatures, isDark && styles.darkSubtitle]}>
                      +{(premiumProduct.features?.length || 0) - 6} more features
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Purchase Button */}
          <View style={styles.purchaseSection}>
            <TouchableOpacity 
              style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
              onPress={handlePurchase}
              disabled={purchasing || loading}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'Processing...' : 'Start Premium Subscription'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Secure payment processing by Stripe
            </Text>
            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Cancel anytime • No commitment
            </Text>
            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              By subscribing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Social Proof */}
          <View style={[styles.testimonialsSection, isDark && styles.darkCard]}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Loved by Thousands</Text>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The AI insights have completely transformed how I understand my mental health patterns. The predictions help me prepare for difficult days."
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - Sarah M., Premium User
              </Text>
            </View>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The custom meditation library is incredible. Having 200+ guided sessions means I always find something perfect for my mood."
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - David L., Premium User
              </Text>
            </View>
          </View>
        </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  valueCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  valueTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  valuePoints: {
    gap: 12,
  },
  valuePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  plansSection: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularPlan: {
    borderColor: '#F59E0B',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  planContent: {
    marginBottom: 20,
  },
  planInfo: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  price: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
  },
  period: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  featuresSection: {
    padding: 24,
    paddingTop: 0,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
  },
  purchaseSection: {
    padding: 24,
    paddingTop: 0,
  },
  purchaseButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  currentPlanCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginBottom: 4,
  },
  platformInfo: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  managementCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  managementTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  managementText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  manageButton: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  darkManageButton: {
    borderColor: '#F59E0B',
  },
  manageButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  darkManageButtonText: {
    color: '#F59E0B',
  },
  testimonialsSection: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testimonial: {
    marginBottom: 20,
  },
  testimonialText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
});