import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Check, Star, Brain, ChartBar as BarChart3, Download, Palette, Heart, Shield, Users, BookOpen, Zap, Clock, Target, TrendingUp, Calendar, FileText, Lightbulb, Activity } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { STRIPE_PRODUCTS, getAllProducts, getProductById, calculateSavings } from '@/src/stripe-config';

interface SubscriptionData {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

const PREMIUM_FEATURES = [
  {
    id: 'unlimited_ai',
    name: 'AI Wellness Coach',
    description: 'Get unlimited personalized insights and coaching from our advanced AI',
    icon: Brain,
    category: 'ai'
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into your wellness patterns with predictive analytics',
    icon: BarChart3,
    category: 'analytics'
  },
  {
    id: 'journal_analysis',
    name: 'Therapeutic Journal Analysis',
    description: 'Weekly AI analysis of your journal entries with therapeutic insights and personalized advice on what to focus on and what to avoid',
    icon: FileText,
    category: 'ai'
  },
  {
    id: 'custom_meditations',
    name: 'Custom Meditation Library',
    description: 'Access 200+ guided meditations and create personalized sessions',
    icon: Heart,
    category: 'content'
  },
  {
    id: 'premium_themes',
    name: 'Premium Themes',
    description: 'Unlock beautiful themes and complete customization options',
    icon: Palette,
    category: 'customization'
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 priority support with wellness experts',
    icon: Shield,
    category: 'content'
  },
  {
    id: 'family_sharing',
    name: 'Family Sharing',
    description: 'Share premium features with up to 4 family members',
    icon: Users,
    category: 'content'
  },
  {
    id: 'content_library',
    name: 'Exclusive Content',
    description: 'Access premium courses, challenges, and expert content',
    icon: BookOpen,
    category: 'content'
  },
  {
    id: 'habit_tracking',
    name: 'Advanced Habit Tracking',
    description: 'Track unlimited habits with smart reminders and insights',
    icon: Target,
    category: 'coaching'
  },
  {
    id: 'mood_prediction',
    name: 'Mood Prediction',
    description: 'AI-powered mood forecasting to prevent difficult days',
    icon: TrendingUp,
    category: 'ai'
  }
];

export default function PremiumScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium_monthly'); // Default to monthly

  const allProducts = getAllProducts();
  const weeklyProduct = getProductById('premium_weekly');
  const monthlyProduct = getProductById('premium_monthly');
  const yearlyProduct = getProductById('premium_yearly');

  const savings = calculateSavings(
    weeklyProduct?.price || 2.99,
    monthlyProduct?.price || 9.99,
    yearlyProduct?.price || 79.99
  );

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
      const selectedProduct = getProductById(selectedPlan);
      if (!selectedProduct) {
        throw new Error('Selected product not found');
      }

      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          price_id: selectedProduct.priceId,
          mode: selectedProduct.mode,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        if (Platform.OS === 'web') {
          window.location.href = data.url;
        } else {
          Alert.alert(
            'Checkout Ready',
            'Please complete your purchase in the browser.',
            [
              {
                text: 'Open Browser',
                onPress: () => {
                  console.log('Checkout URL:', data.url);
                }
              }
            ]
          );
        }
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
  const currentProduct = isSubscribed ? allProducts.find(p => p.priceId === subscription?.price_id) : null;

  const getIntervalIcon = (interval?: string) => {
    switch (interval) {
      case 'week': return <Calendar size={16} color="#F59E0B" />;
      case 'month': return <Calendar size={16} color="#10B981" />;
      case 'year': return <Crown size={16} color="#8B5CF6" />;
      default: return <Calendar size={16} color="#6B7280" />;
    }
  };

  const getIntervalColor = (interval?: string) => {
    switch (interval) {
      case 'week': return '#F59E0B';
      case 'month': return '#10B981';
      case 'year': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

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
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 210 }}
          >
            <View style={styles.header}>
              <Crown size={60} color="#F59E0B" />
              <Text style={[styles.title, isDark && styles.darkText]}>You're Premium! 👑</Text>
              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
                Enjoying all the exclusive features of Mindbloom Premium
              </Text>
            </View>

            <View style={[styles.currentPlanCard, isDark && styles.darkCard]}>
              <View style={styles.planHeader}>
                <View style={styles.planTitleContainer}>
                  {getIntervalIcon(currentProduct?.interval)}
                  <Text style={[styles.planName, isDark && styles.darkText]}>
                    {currentProduct?.name || 'Premium Plan'}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>${currentProduct?.price || 9.99}</Text>
                  <Text style={[styles.period, isDark && styles.darkSubtitle]}>
                    /{currentProduct?.interval || 'month'}
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
                {PREMIUM_FEATURES.map((feature) => (
                  <View key={feature.id} style={[styles.featureCard, isDark && styles.darkCard]}>
                    <View style={styles.featureIcon}>
                      <feature.icon size={24} color="#F59E0B" />
                    </View>
                    <Text style={[styles.featureName, isDark && styles.darkText]}>
                      {feature.name}
                    </Text>
                    <Text style={[styles.featureDescription, isDark && styles.darkSubtitle]}>
                      {feature.description}
                    </Text>
                  </View>
                ))}
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
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 210 }}
        >
          <View style={styles.header}>
            <Crown size={60} color="#F59E0B" />
            <Text style={[styles.title, isDark && styles.darkText]}>Choose Your Plan</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              Transform your wellness journey with premium features
            </Text>
          </View>

          {/* Value Proposition */}
          <View style={[styles.valueCard, isDark && styles.darkCard]}>
            <Text style={[styles.valueTitle, isDark && styles.darkText]}>Why Go Premium?</Text>
            <View style={styles.valuePoints}>
              <View style={styles.valuePoint}>
                <Brain size={20} color="#F59E0B" />
                <Text style={[styles.valueText, isDark && styles.darkSubtitle]}>
                  AI-powered insights that adapt to your unique patterns
                </Text>
              </View>
              <View style={styles.valuePoint}>
                <FileText size={20} color="#8B5CF6" />
                <Text style={[styles.valueText, isDark && styles.darkSubtitle]}>
                  Weekly therapeutic journal analysis with personalized advice
                </Text>
              </View>
              <View style={styles.valuePoint}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={[styles.valueText, isDark && styles.darkSubtitle]}>
                  Advanced analytics to track your wellness journey
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

          {/* Premium Features Showcase */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Premium Features</Text>
            <View style={styles.featuresGrid}>
              {PREMIUM_FEATURES.slice(0, 6).map((feature) => (
                <View key={feature.id} style={[styles.featureCard, isDark && styles.darkCard]}>
                  <View style={styles.featureIcon}>
                    <feature.icon size={24} color="#F59E0B" />
                  </View>
                  <Text style={[styles.featureName, isDark && styles.darkText]}>
                    {feature.name}
                  </Text>
                  <Text style={[styles.featureDescription, isDark && styles.darkSubtitle]}>
                    {feature.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Flexible Pricing Options</Text>
            <Text style={[styles.planSubtitle, isDark && styles.darkSubtitle]}>
              All plans include free trial • Cancel anytime
            </Text>
            
            {allProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.planCard,
                  isDark && styles.darkCard,
                  selectedPlan === product.id && styles.selectedPlan,
                  product.popular && styles.popularPlan
                ]}
                onPress={() => setSelectedPlan(product.id)}
              >
                {product.popular && (
                  <View style={styles.popularBadge}>
                    <Star size={16} color="#FFFFFF" />
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}

                {product.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{product.savings}</Text>
                  </View>
                )}
                
                <View style={styles.planContent}>
                  <View style={styles.planInfo}>
                    <View style={styles.planTitleContainer}>
                      {getIntervalIcon(product.interval)}
                      <Text style={[styles.planName, isDark && styles.darkText]}>{product.name}</Text>
                    </View>
                    <Text style={[styles.planDescription, isDark && styles.darkSubtitle]}>
                      {product.description}
                    </Text>
                    {product.trialDays && (
                      <View style={styles.trialInfo}>
                        <Clock size={14} color={getIntervalColor(product.interval)} />
                        <Text style={[styles.trialText, { color: getIntervalColor(product.interval) }]}>
                          {product.trialDays}-day free trial
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.priceSection}>
                    <View style={styles.priceContainer}>
                      <Text style={[styles.price, { color: getIntervalColor(product.interval) }]}>
                        ${product.price}
                      </Text>
                      <Text style={[styles.period, isDark && styles.darkSubtitle]}>
                        /{product.interval}
                      </Text>
                    </View>
                    {product.interval === 'year' && (
                      <Text style={styles.yearlyEquivalent}>
                        ${(product.price / 12).toFixed(2)}/month
                      </Text>
                    )}
                    {product.interval === 'week' && (
                      <Text style={styles.weeklyEquivalent}>
                        ${(product.price * 4.33).toFixed(2)}/month
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {product.features?.slice(0, 4).map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check size={14} color="#10B981" />
                      <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                        {feature}
                      </Text>
                    </View>
                  )) || []}
                  {(product.features?.length || 0) > 4 && (
                    <Text style={[styles.moreFeatures, isDark && styles.darkSubtitle]}>
                      +{(product.features?.length || 0) - 4} more features
                    </Text>
                  )}
                </View>

                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radio,
                    selectedPlan === product.id && [styles.radioSelected, { borderColor: getIntervalColor(product.interval) }]
                  ]}>
                    {selectedPlan === product.id && (
                      <View style={[styles.radioDot, { backgroundColor: getIntervalColor(product.interval) }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Savings Comparison */}
          <View style={[styles.savingsCard, isDark && styles.darkCard]}>
            <Text style={[styles.savingsTitle, isDark && styles.darkText]}>💰 Savings Breakdown</Text>
            <View style={styles.savingsComparison}>
              <Text style={[styles.savingsItem, isDark && styles.darkSubtitle]}>
                Monthly vs Weekly: Save {savings.monthlyVsWeekly}%
              </Text>
              <Text style={[styles.savingsItem, isDark && styles.darkSubtitle]}>
                Yearly vs Monthly: Save {savings.yearlyVsMonthly}%
              </Text>
              <Text style={[styles.savingsHighlight, isDark && styles.darkText]}>
                Yearly vs Weekly: Save {savings.yearlyVsWeekly}% 🎉
              </Text>
            </View>
          </View>

          {/* Purchase Button */}
          <View style={styles.purchaseSection}>
            <TouchableOpacity 
              style={[
                styles.purchaseButton, 
                purchasing && styles.purchaseButtonDisabled,
                { backgroundColor: getIntervalColor(getProductById(selectedPlan)?.interval) }
              ]}
              onPress={handlePurchase}
              disabled={purchasing || loading}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'Processing...' : `Start ${getProductById(selectedPlan)?.trialDays}-Day Free Trial`}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Free trial, then ${getProductById(selectedPlan)?.price}/{getProductById(selectedPlan)?.interval}
            </Text>
            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Cancel anytime • Secure payment by Stripe
            </Text>
            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              By subscribing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Feature Comparison */}
          <View style={[styles.comparisonCard, isDark && styles.darkCard]}>
            <Text style={[styles.comparisonTitle, isDark && styles.darkText]}>All Plans Include</Text>
            <View style={styles.comparisonFeatures}>
              <View style={styles.comparisonFeature}>
                <Check size={16} color="#10B981" />
                <Text style={[styles.comparisonText, isDark && styles.darkSubtitle]}>
                  Unlimited AI Insights & Coaching
                </Text>
              </View>
              <View style={styles.comparisonFeature}>
                <Check size={16} color="#10B981" />
                <Text style={[styles.comparisonText, isDark && styles.darkSubtitle]}>
                  Weekly Therapeutic Journal Analysis
                </Text>
              </View>
              <View style={styles.comparisonFeature}>
                <Check size={16} color="#10B981" />
                <Text style={[styles.comparisonText, isDark && styles.darkSubtitle]}>
                  Advanced Mood Analytics
                </Text>
              </View>
              <View style={styles.comparisonFeature}>
                <Check size={16} color="#10B981" />
                <Text style={[styles.comparisonText, isDark && styles.darkSubtitle]}>
                  Custom Meditation Library
                </Text>
              </View>
              <View style={styles.comparisonFeature}>
                <Check size={16} color="#10B981" />
                <Text style={[styles.comparisonText, isDark && styles.darkSubtitle]}>
                  Priority Support
                </Text>
              </View>
            </View>
          </View>

          {/* Social Proof */}
          <View style={[styles.testimonialsSection, isDark && styles.darkCard]}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Loved by Thousands</Text>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The weekly journal analysis is incredible. It's like having a personal therapist who really understands my patterns and gives me actionable advice."
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - Sarah M., Premium User
              </Text>
            </View>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The AI insights help me understand what triggers my anxiety and what activities actually help. It's personalized therapy at my fingertips."
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - David L., Premium User
              </Text>
            </View>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The flexibility to choose weekly, monthly, or yearly billing made it easy to find a plan that works for my budget."
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - Maria R., Premium User
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
  plansSection: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  planSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedPlan: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  popularPlan: {
    borderColor: '#10B981',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#10B981',
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
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
    marginRight: 16,
  },
  planTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  period: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  yearlyEquivalent: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B5CF6',
    marginTop: 2,
  },
  weeklyEquivalent: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#F59E0B',
    marginTop: 2,
  },
  planFeatures: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  moreFeatures: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  radioContainer: {
    alignItems: 'flex-end',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#F59E0B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  savingsCard: {
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
  savingsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  savingsComparison: {
    gap: 8,
  },
  savingsItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  savingsHighlight: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
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
  comparisonCard: {
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
  comparisonTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonFeatures: {
    gap: 12,
  },
  comparisonFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
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