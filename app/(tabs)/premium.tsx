import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Check, Star, Brain, ChartBar as BarChart3, Download, Palette, Heart, Shield, Users, BookOpen, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription, SUBSCRIPTION_PLANS } from '@/contexts/SubscriptionContext';
import { PremiumFeature } from '@/types/subscription';

const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'unlimited_ai',
    name: 'Unlimited AI Insights',
    description: 'Get personalized insights and recommendations without limits',
    icon: 'Brain',
    category: 'ai'
  },
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep dive into your wellness patterns with detailed charts and trends',
    icon: 'BarChart3',
    category: 'analytics'
  },
  {
    id: 'custom_meditations',
    name: 'Custom Meditation Sessions',
    description: 'Create personalized meditation experiences tailored to your needs',
    icon: 'Heart',
    category: 'content'
  },
  {
    id: 'data_export',
    name: 'Export Your Data',
    description: 'Download your journal entries, mood data, and progress reports',
    icon: 'Download',
    category: 'export'
  },
  {
    id: 'premium_themes',
    name: 'Premium Themes',
    description: 'Access exclusive color schemes and customization options',
    icon: 'Palette',
    category: 'customization'
  },
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: 'Get faster response times and dedicated customer support',
    icon: 'Shield',
    category: 'content'
  },
  {
    id: 'family_sharing',
    name: 'Family Sharing',
    description: 'Share your premium subscription with up to 4 family members',
    icon: 'Users',
    category: 'content'
  },
  {
    id: 'content_library',
    name: 'Exclusive Content',
    description: 'Access premium guided meditations, courses, and wellness programs',
    icon: 'BookOpen',
    category: 'content'
  }
];

export default function PremiumScreen() {
  const { isDark } = useTheme();
  const { isPremium, currentPlan, purchasePlan, loading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[1].id); // Default to yearly
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await purchasePlan(selectedPlan);
      if (result.success) {
        Alert.alert(
          'Welcome to Premium! 👑',
          'Thank you for upgrading to Mindbloom Premium. Enjoy all the exclusive features!',
          [{ text: 'Get Started', style: 'default' }]
        );
      } else {
        Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const getFeatureIcon = (iconName: string) => {
    const icons = {
      Brain,
      BarChart3,
      Heart,
      Download,
      Palette,
      Shield,
      Users,
      BookOpen,
      Zap
    };
    const IconComponent = icons[iconName as keyof typeof icons] || Star;
    return IconComponent;
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
                Active • Renews automatically
              </Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Your Premium Features</Text>
              <View style={styles.featuresGrid}>
                {PREMIUM_FEATURES.map((feature) => {
                  const IconComponent = getFeatureIcon(feature.icon);
                  return (
                    <View key={feature.id} style={[styles.featureCard, isDark && styles.darkCard]}>
                      <View style={styles.featureIcon}>
                        <IconComponent size={24} color="#F59E0B" />
                      </View>
                      <Text style={[styles.featureName, isDark && styles.darkText]}>
                        {feature.name}
                      </Text>
                      <Text style={[styles.featureDescription, isDark && styles.darkSubtitle]}>
                        {feature.description}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.managementCard, isDark && styles.darkCard]}>
              <Text style={[styles.managementTitle, isDark && styles.darkText]}>
                Manage Subscription
              </Text>
              <Text style={[styles.managementText, isDark && styles.darkSubtitle]}>
                You can manage your subscription, change plans, or cancel anytime through your account settings.
              </Text>
              <TouchableOpacity style={[styles.manageButton, isDark && styles.darkManageButton]}>
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
            <Text style={[styles.title, isDark && styles.darkText]}>Upgrade to Premium</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
              Unlock the full potential of your wellness journey
            </Text>
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Choose Your Plan</Text>
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

          {/* Premium Features */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Premium Features</Text>
            <View style={styles.featuresGrid}>
              {PREMIUM_FEATURES.slice(0, 6).map((feature) => {
                const IconComponent = getFeatureIcon(feature.icon);
                return (
                  <View key={feature.id} style={[styles.featureCard, isDark && styles.darkCard]}>
                    <View style={styles.featureIcon}>
                      <IconComponent size={24} color="#F59E0B" />
                    </View>
                    <Text style={[styles.featureName, isDark && styles.darkText]}>
                      {feature.name}
                    </Text>
                    <Text style={[styles.featureDescription, isDark && styles.darkSubtitle]}>
                      {feature.description}
                    </Text>
                  </View>
                );
              })}
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
                {purchasing ? 'Processing...' : 'Start Premium Journey'}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              • Cancel anytime • 7-day free trial • No commitment
            </Text>
            <Text style={[styles.disclaimer, isDark && styles.darkSubtitle]}>
              By subscribing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Testimonials */}
          <View style={[styles.testimonialsSection, isDark && styles.darkCard]}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>What Premium Users Say</Text>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The AI insights have completely transformed how I understand my mental health patterns. Worth every penny!"
              </Text>
              <Text style={[styles.testimonialAuthor, isDark && styles.darkSubtitle]}>
                - Sarah M., Premium User
              </Text>
            </View>
            <View style={styles.testimonial}>
              <Text style={[styles.testimonialText, isDark && styles.darkText]}>
                "The advanced analytics helped me identify triggers I never noticed before. Game changer!"
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
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
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
  darkCard: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
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