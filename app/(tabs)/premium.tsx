import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Check, Star, Brain, ChartBar as BarChart3, Download, Palette, Heart, Shield, Users, BookOpen, Zap, Clock, Target, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/contexts/SubscriptionContext';

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
    id: 'custom_meditations',
    name: 'Custom Meditation Library',
    description: 'Access 200+ guided meditations and create personalized sessions',
    icon: Heart,
    category: 'content'
  },
  {
    id: 'data_export',
    name: 'Export & Backup',
    description: 'Download your complete wellness data and create backups',
    icon: Download,
    category: 'export'
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
  const { isPremium, currentPlan, purchasePlan, loading, trialDaysLeft, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[1].id); // Default to yearly
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await purchasePlan(selectedPlan);
      if (result.success) {
        // Success is handled in the context with an alert
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (isPremium) {
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
              
              {subscription?.status === 'trial' && trialDaysLeft > 0 && (
                <View style={[styles.trialBadge, isDark && styles.darkTrialBadge]}>
                  <Clock size={16} color="#F59E0B" />
                  <Text style={[styles.trialText, isDark && styles.darkTrialText]}>
                    {trialDaysLeft} days left in trial
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.currentPlanCard, isDark && styles.darkCard]}>
              <View style={styles.planHeader}>
                <Text style={[styles.planName, isDark && styles.darkText]}>
                  {currentPlan?.name || 'Premium Plan'}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>${currentPlan?.price}</Text>
                  <Text style={[styles.period, isDark && styles.darkSubtitle]}>
                    /{currentPlan?.period}
                  </Text>
                </View>
              </View>
              <Text style={[styles.planStatus, isDark && styles.darkSubtitle]}>
                {subscription?.status === 'trial' ? 'Free Trial' : 'Active'} • 
                {subscription?.status === 'trial' ? ` ${trialDaysLeft} days left` : ' Renews automatically'}
              </Text>
              <Text style={[styles.platformInfo, isDark && styles.darkSubtitle]}>
                Platform: {subscription?.platform || 'Unknown'}
              </Text>
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
                {Platform.OS === 'web' 
                  ? 'Manage your subscription through Stripe Customer Portal or contact support.'
                  : 'Manage your subscription through your device\'s App Store settings.'
                }
              </Text>
              <TouchableOpacity style={[styles.manageButton, isDark && styles.darkManageButton]}>
                <Text style={[styles.manageButtonText, isDark && styles.darkManageButtonText]}>
                  {Platform.OS === 'web' ? 'Open Stripe Portal' : 'Open App Store'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.statsCard, isDark && styles.darkCard]}>
              <Text style={[styles.statsTitle, isDark && styles.darkText]}>Premium Benefits</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={[styles.benefitText, isDark && styles.darkSubtitle]}>
                    Unlimited AI insights and coaching
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={[styles.benefitText, isDark && styles.darkSubtitle]}>
                    Advanced analytics and predictions
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={[styles.benefitText, isDark && styles.darkSubtitle]}>
                    200+ premium meditations
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={[styles.benefitText, isDark && styles.darkSubtitle]}>
                    Priority support & expert guidance
                  </Text>
                </View>
              </View>
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

          {/* Pricing Plans */}
          <View style={styles.plansSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Choose Your Plan</Text>
            <Text style={[styles.planSubtitle, isDark && styles.darkSubtitle]}>
              Start with a 7-day free trial • Cancel anytime
            </Text>
            
            {SUBSCRIPTION_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isDark && styles.darkCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                  plan.popular && styles.popularPlan
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Star size={16} color="#FFFFFF" />
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                
                <View style={styles.planContent}>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, isDark && styles.darkText]}>{plan.name}</Text>
                    {plan.savings && (
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    )}
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>${plan.price}</Text>
                    <Text style={[styles.period, isDark && styles.darkSubtitle]}>/{plan.period}</Text>
                  </View>
                </View>

                <View style={styles.planFeatures}>
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check size={16} color="#10B981" />
                      <Text style={[styles.featureText, isDark && styles.darkSubtitle]}>
                        {feature}
                      </Text>
                    </View>
                  ))}
                  {plan.features.length > 4 && (
                    <Text style={[styles.moreFeatures, isDark && styles.darkSubtitle]}>
                      +{plan.features.length - 4} more features
                    </Text>
                  )}
                </View>

                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radio,
                    selectedPlan === plan.id && styles.radioSelected
                  ]}>
                    {selectedPlan === plan.id && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Premium Features Grid */}
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

          {/* Purchase Button */}
          <View style={styles.purchaseSection}>
            <TouchableOpacity 
              style={[styles.purchaseButton, purchasing && styles.purchaseButtonDisabled]}
              onPress={handlePurchase}
              disabled={purchasing || loading}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.purchaseButtonText}>
                {purchasing ? 'Processing...' : 'Start 7-Day Free Trial'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Free for 7 days, then ${SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price}/{SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.period}
            </Text>
            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Cancel anytime • No commitment • Secure payment
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
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "Family sharing is a game-changer. My whole family now uses Mindbloom and we support each other's wellness journey."
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - Maria R., Premium User
              </Text>
            </View>
          </View>

          {/* Platform Info */}
          <View style={[styles.platformInfo, isDark && styles.darkCard]}>
            <Text style={[styles.platformTitle, isDark && styles.darkText]}>Payment Information</Text>
            <Text style={[styles.platformText, isDark && styles.darkSubtitle]}>
              {Platform.OS === 'web' 
                ? 'Secure payment processing by Stripe. Your subscription will be managed through our web portal.'
                : 'Payments are processed through your device\'s App Store. Manage your subscription in your App Store settings.'
              }
            </Text>
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
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  darkTrialBadge: {
    backgroundColor: '#374151',
  },
  trialText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  darkTrialText: {
    color: '#FCD34D',
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
    padding: 24,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  savingsText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 28,
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
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
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
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
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
  platformTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  platformText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});