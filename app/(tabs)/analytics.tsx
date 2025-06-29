import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, TrendingUp, Calendar, Brain, Heart, Target, Zap, Award, Crown, Star, Clock, Lightbulb, Activity } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { analyticsService, wellnessService, moodService, journalService } from '@/lib/database';
import { PremiumFeatureGate } from '@/components/PremiumFeatureGate';

type TimeRange = 'week' | 'month' | 'year';

const { width: screenWidth } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');
  const [moodData, setMoodData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any>({});
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);
  const [moodPrediction, setMoodPrediction] = useState<any>(null);
  const [wellnessScore, setWellnessScore] = useState<number>(0);
  const [journalStats, setJournalStats] = useState<any>(null);
  const [gardenStats, setGardenStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
      checkPremiumStatus();
    }
  }, [user, selectedRange]);

  const checkPremiumStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status')
        .maybeSingle();
      
      const isActive = data?.subscription_status === 'active' || data?.subscription_status === 'trialing';
      setIsPremium(isActive);
      
      // Load premium features if user has access
      if (isActive) {
        loadPremiumFeatures();
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const loadPremiumFeatures = async () => {
    if (!user) return;
    
    try {
      // Load advanced analytics
      const advanced = await analyticsService.getAdvancedAnalytics(user.id);
      setAdvancedAnalytics(advanced);
      setWellnessScore(advanced.wellnessScore || 0);

      // Load mood prediction
      const prediction = await analyticsService.getMoodPrediction(user.id);
      setMoodPrediction(prediction);
    } catch (error) {
      console.error('Error loading premium features:', error);
    }
  };

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    try {
      // Calculate date range based on selection
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Load real data from database
      const [
        moodEntries,
        wellnessActivities,
        journalEntries,
        journalStatsData,
        gardenStatsData
      ] = await Promise.all([
        moodService.getMoodEntriesForPeriod(user.id, startDate.toISOString(), endDate.toISOString()),
        wellnessService.getActivitiesForPeriod(user.id, startDate.toISOString(), endDate.toISOString()),
        journalService.getJournalEntries(user.id, 50), // Get more entries for better analysis
        journalService.getJournalStats(user.id),
        analyticsService.getDashboardData(user.id)
      ]);

      // Process mood data for chart
      const processedMoodData = processMoodDataForChart(moodEntries, selectedRange);
      setMoodData(processedMoodData);

      // Process activities data
      const processedActivities = processActivitiesData(wellnessActivities);
      setActivities(processedActivities);

      // Calculate real streaks
      const calculatedStreaks = calculateStreaks(moodEntries, wellnessActivities, journalEntries);
      setStreaks(calculatedStreaks);

      // Generate insights based on real data
      const generatedInsights = generateRealInsights(moodEntries, wellnessActivities, journalEntries);
      setInsights(generatedInsights);

      // Set stats
      setJournalStats(journalStatsData);
      setGardenStats(gardenStatsData.gardenStats);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processMoodDataForChart = (moodEntries: any[], range: TimeRange) => {
    const moodValues: Record<string, number> = {
      'excellent': 10,
      'happy': 9,
      'good': 8,
      'calm': 7,
      'neutral': 6,
      'tired': 5,
      'anxious': 4,
      'low': 3,
      'sad': 2,
      'poor': 1
    };

    const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
    const dailyData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let dayName: string;
      if (range === 'week') {
        dayName = date.toLocaleDateString('en', { weekday: 'short' });
      } else if (range === 'month') {
        dayName = date.getDate().toString();
      } else {
        dayName = date.toLocaleDateString('en', { month: 'short' });
      }
      
      const dayEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate.toDateString() === date.toDateString();
      });
      
      const averageMood = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + (moodValues[entry.mood] || 6), 0) / dayEntries.length
        : 0;
      
      // Calculate energy based on mood and activities for that day
      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.created_at);
        return activityDate.toDateString() === date.toDateString();
      });
      
      const energyBoost = dayActivities.length * 0.5;
      const energy = averageMood > 0 ? Math.min(10, averageMood + energyBoost) : 0;
      
      dailyData.push({
        day: dayName,
        mood: Math.round(averageMood),
        energy: Math.round(energy)
      });
    }
    
    return dailyData;
  };

  const processActivitiesData = (wellnessActivities: any[]) => {
    const activityCounts = wellnessActivities.reduce((acc, activity) => {
      const name = activity.activity_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(activityCounts).map(([name, count]) => {
      // Calculate trend based on recent vs older activities
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentCount = wellnessActivities.filter(activity => 
        activity.activity_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) === name &&
        new Date(activity.created_at) > weekAgo
      ).length;
      
      const olderCount = count - recentCount;
      const trend = recentCount > olderCount ? 'up' : recentCount < olderCount ? 'down' : 'stable';
      const change = olderCount > 0 ? Math.round(((recentCount - olderCount) / olderCount) * 100) : 0;
      
      return {
        name,
        count,
        trend,
        change: Math.abs(change)
      };
    });
  };

  const calculateStreaks = (moodEntries: any[], activities: any[], journalEntries: any[]) => {
    const calculateStreak = (entries: any[], type: 'daily' | 'activity') => {
      if (entries.length === 0) return 0;
      
      const sortedEntries = entries.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (const entry of sortedEntries) {
        const entryDate = new Date(entry.created_at);
        entryDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === streak) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (daysDiff > streak) {
          break;
        }
      }
      
      return streak;
    };

    return {
      meditation: calculateStreak(activities.filter(a => a.activity_type === 'meditation'), 'activity'),
      journal: calculateStreak(journalEntries, 'daily'),
      mood: calculateStreak(moodEntries, 'daily'),
      exercise: calculateStreak(activities.filter(a => a.activity_type === 'exercise'), 'activity')
    };
  };

  const generateRealInsights = (moodEntries: any[], activities: any[], journalEntries: any[]) => {
    const insights = [];
    
    // Mood trend analysis
    if (moodEntries.length >= 2) {
      const moodValues: Record<string, number> = {
        'excellent': 10, 'happy': 9, 'good': 8, 'calm': 7, 'neutral': 6,
        'tired': 5, 'anxious': 4, 'low': 3, 'sad': 2, 'poor': 1
      };
      
      const recentMoods = moodEntries.slice(0, Math.ceil(moodEntries.length / 2));
      const olderMoods = moodEntries.slice(Math.ceil(moodEntries.length / 2));
      
      const recentAvg = recentMoods.reduce((sum, entry) => sum + (moodValues[entry.mood] || 6), 0) / recentMoods.length;
      const olderAvg = olderMoods.reduce((sum, entry) => sum + (moodValues[entry.mood] || 6), 0) / olderMoods.length;
      
      const improvement = ((recentAvg - olderAvg) / olderAvg) * 100;
      
      insights.push({
        icon: TrendingUp,
        title: 'Mood Trend',
        description: improvement > 0 
          ? `Your mood has improved ${Math.round(improvement)}% recently`
          : improvement < 0 
          ? `Your mood has declined ${Math.round(Math.abs(improvement))}% recently`
          : 'Your mood has been stable',
        color: improvement > 0 ? '#10B981' : improvement < 0 ? '#EF4444' : '#6B7280',
        change: `${improvement > 0 ? '+' : ''}${Math.round(improvement)}%`,
        trend: improvement > 0 ? 'positive' : improvement < 0 ? 'negative' : 'neutral'
      });
    }

    // Activity analysis
    const completedActivities = activities.filter(a => a.completed).length;
    insights.push({
      icon: Brain,
      title: 'Wellness Activities',
      description: `You've completed ${completedActivities} wellness activities`,
      color: '#3B82F6',
      change: `${completedActivities} activities`,
      trend: 'positive'
    });

    // Journal consistency
    if (journalEntries.length > 0) {
      const daysWithEntries = new Set(
        journalEntries.map(entry => new Date(entry.created_at).toDateString())
      ).size;
      
      insights.push({
        icon: Target,
        title: 'Journal Consistency',
        description: `You've journaled on ${daysWithEntries} different days`,
        color: '#8B5CF6',
        change: `${daysWithEntries} days`,
        trend: 'positive'
      });
    }

    // Streak analysis
    const maxStreak = Math.max(...Object.values(streaks));
    insights.push({
      icon: Zap,
      title: 'Best Streak',
      description: `Your longest streak is ${maxStreak} days`,
      color: '#F59E0B',
      change: `${maxStreak} days`,
      trend: 'positive'
    });

    return insights;
  };

  const getBarHeight = (value: number) => {
    return Math.max((value / 10) * 80, 8);
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#10B981';
    if (mood >= 6) return '#F59E0B';
    if (mood >= 4) return '#EF4444';
    return '#9CA3AF';
  };

  const getWellnessScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#EF4444';
    return '#9CA3AF';
  };

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'positive': return '#10B981';
      case 'challenging': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading your analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient 
        colors={isDark ? ['#1F2937', '#111827'] : ['#EDE9FE', '#FFFFFF']} 
        style={styles.gradient}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 210 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.greeting, isDark && styles.darkText]}>Your Analytics 📊</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>Track your mental wellness journey</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Crown size={16} color="#F59E0B" />
                <Text style={styles.premiumText}>Premium Analytics</Text>
              </View>
            )}
          </View>

          {/* Wellness Score - Premium Feature */}
          <PremiumFeatureGate
            feature="Wellness Score"
            description="Get a comprehensive wellness score based on your mood, activities, and journal entries with AI-powered insights."
            isActive={isPremium}
          >
            <View style={[styles.scoreCard, isDark && styles.darkCard]}>
              <View style={styles.scoreHeader}>
                <Star size={24} color="#F59E0B" />
                <Text style={[styles.scoreTitle, isDark && styles.darkText]}>Wellness Score</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreValue, { color: getWellnessScoreColor(wellnessScore) }]}>
                  {wellnessScore}
                </Text>
                <Text style={[styles.scoreLabel, isDark && styles.darkSubtitle]}>out of 100</Text>
              </View>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreFill, 
                    { 
                      width: `${wellnessScore}%`,
                      backgroundColor: getWellnessScoreColor(wellnessScore)
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.scoreDescription, isDark && styles.darkSubtitle]}>
                {wellnessScore >= 80 ? 'Excellent wellness habits!' : 
                 wellnessScore >= 60 ? 'Good progress, keep it up!' :
                 wellnessScore >= 40 ? 'Room for improvement' : 'Focus on building consistent habits'}
              </Text>
            </View>
          </PremiumFeatureGate>

          {/* Mood Prediction - Premium Feature */}
          <PremiumFeatureGate
            feature="AI Mood Prediction"
            description="Get AI-powered predictions about your mood trends to help you prepare for challenging days."
            isActive={isPremium && moodPrediction}
          >
            <View style={[styles.predictionCard, isDark && styles.darkCard]}>
              <View style={styles.predictionHeader}>
                <Brain size={24} color="#8B5CF6" />
                <Text style={[styles.predictionTitle, isDark && styles.darkText]}>AI Mood Prediction</Text>
                <Clock size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </View>
              <View style={styles.predictionContent}>
                <View style={styles.predictionMain}>
                  <Text style={[styles.predictionLabel, isDark && styles.darkSubtitle]}>Next 24-48 hours:</Text>
                  <Text style={[
                    styles.predictionValue, 
                    { color: getPredictionColor(moodPrediction?.prediction) }
                  ]}>
                    {moodPrediction?.prediction === 'positive' ? 'Positive Mood Expected' :
                     moodPrediction?.prediction === 'challenging' ? 'Challenging Period Ahead' :
                     'Stable Mood Expected'}
                  </Text>
                  <Text style={[styles.confidenceText, isDark && styles.darkSubtitle]}>
                    Confidence: {Math.round((moodPrediction?.confidence || 0.7) * 100)}%
                  </Text>
                </View>
                <View style={styles.predictionFactors}>
                  <Text style={[styles.factorsTitle, isDark && styles.darkText]}>Key Factors:</Text>
                  {(moodPrediction?.factors || ['Recent mood patterns', 'Activity levels']).slice(0, 2).map((factor: string, index: number) => (
                    <Text key={index} style={[styles.factorItem, isDark && styles.darkSubtitle]}>
                      • {factor}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </PremiumFeatureGate>

          {/* Time Range Selector */}
          <View style={[styles.timeRangeContainer, isDark && styles.darkTimeRange]}>
            {(['week', 'month', 'year'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeRangeButton,
                  selectedRange === range && styles.activeTimeRange
                ]}
                onPress={() => setSelectedRange(range)}
              >
                <Text style={[
                  styles.timeRangeText,
                  isDark && styles.darkTimeRangeText,
                  selectedRange === range && styles.activeTimeRangeText
                ]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mood Chart */}
          <View style={[styles.chartCard, isDark && styles.darkCard]}>
            <View style={styles.chartHeader}>
              <BarChart3 size={24} color="#8B5CF6" />
              <Text style={[styles.chartTitle, isDark && styles.darkText]}>Mood & Energy Levels</Text>
            </View>
            {moodData.length > 0 ? (
              <View style={styles.chart}>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
                    <Text style={[styles.legendText, isDark && styles.darkLegendText]}>Mood</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.legendText, isDark && styles.darkLegendText]}>Energy</Text>
                  </View>
                </View>
                <View style={styles.chartBars}>
                  {moodData.map((data, index) => (
                    <View key={index} style={styles.barGroup}>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: getBarHeight(data.mood),
                              backgroundColor: getMoodColor(data.mood)
                            }
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            {
                              height: getBarHeight(data.energy),
                              backgroundColor: '#10B981',
                              marginLeft: 4
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, isDark && styles.darkBarLabel]}>{data.day}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={[styles.noDataText, isDark && styles.darkText]}>
                  No mood data available for the selected period
                </Text>
                <Text style={[styles.noDataSubtext, isDark && styles.darkSubtitle]}>
                  Start tracking your mood to see trends and insights
                </Text>
              </View>
            )}
          </View>

          {/* Advanced Analytics - Premium Feature */}
          <PremiumFeatureGate
            feature="Advanced Analytics"
            description="Get detailed mood patterns, activity correlations, and personalized AI recommendations to optimize your wellness journey."
            isActive={isPremium && advancedAnalytics}
          >
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Advanced Insights</Text>
              
              {/* Mood Patterns */}
              <View style={[styles.advancedCard, isDark && styles.darkCard]}>
                <View style={styles.advancedHeader}>
                  <Activity size={20} color="#8B5CF6" />
                  <Text style={[styles.advancedTitle, isDark && styles.darkText]}>Mood Patterns</Text>
                </View>
                <Text style={[styles.advancedDescription, isDark && styles.darkSubtitle]}>
                  Your mood is trending {advancedAnalytics?.moodPatterns?.trends?.direction || 'stable'} with a 
                  {(advancedAnalytics?.moodPatterns?.trends?.change || 0) > 0 ? ' positive' : ' negative'} change 
                  of {Math.abs(advancedAnalytics?.moodPatterns?.trends?.change || 0)} points.
                </Text>
                <Text style={[styles.advancedDescription, isDark && styles.darkSubtitle]}>
                  Volatility: {(advancedAnalytics?.moodPatterns?.volatility || 1.2).toFixed(1)} 
                  {(advancedAnalytics?.moodPatterns?.volatility || 0) > 2 ? ' (High variability)' : ' (Stable)'}
                </Text>
              </View>

              {/* Activity Correlations */}
              <View style={[styles.advancedCard, isDark && styles.darkCard]}>
                <View style={styles.advancedHeader}>
                  <Target size={20} color="#10B981" />
                  <Text style={[styles.advancedTitle, isDark && styles.darkText]}>Activity Impact</Text>
                </View>
                {(advancedAnalytics?.activityCorrelations || []).slice(0, 3).map((correlation: any, index: number) => (
                  <View key={index} style={styles.correlationRow}>
                    <Text style={[styles.correlationActivity, isDark && styles.darkText]}>
                      {correlation.activity.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Text>
                    <View style={styles.correlationStats}>
                      <Text style={[styles.correlationImpact, { color: correlation.averageImpact > 6 ? '#10B981' : '#F59E0B' }]}>
                        {correlation.averageImpact.toFixed(1)}/10
                      </Text>
                      <Text style={[styles.correlationConsistency, isDark && styles.darkSubtitle]}>
                        {Math.round(correlation.consistency * 100)}% consistent
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </PremiumFeatureGate>

          {/* Streaks Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Current Streaks</Text>
            <View style={styles.streaksGrid}>
              {Object.entries(streaks).map(([activity, days]) => (
                <View key={activity} style={[styles.streakCard, isDark && styles.darkCard]}>
                  <Award size={20} color="#F59E0B" />
                  <Text style={[styles.streakDays, isDark && styles.darkText]}>{days as number}</Text>
                  <Text style={[styles.streakLabel, isDark && styles.darkSubtitle]}>
                    {activity.charAt(0).toUpperCase() + activity.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Key Insights */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Key Insights</Text>
            <View style={styles.insightsGrid}>
              {insights.map((insight, index) => (
                <View key={index} style={[styles.insightCard, isDark && styles.darkCard]}>
                  <View style={styles.insightHeader}>
                    <insight.icon size={20} color={insight.color} />
                    <Text style={[
                      styles.insightChange,
                      { color: insight.trend === 'positive' ? '#10B981' : insight.trend === 'negative' ? '#EF4444' : '#6B7280' }
                    ]}>
                      {insight.change}
                    </Text>
                  </View>
                  <Text style={[styles.insightTitle, isDark && styles.darkText]}>{insight.title}</Text>
                  <Text style={[styles.insightDescription, isDark && styles.darkSubtitle]}>
                    {insight.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Activity Summary */}
          {activities.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Activity Summary</Text>
              <View style={[styles.activitiesCard, isDark && styles.darkCard]}>
                {activities.map((activity, index) => (
                  <View key={index} style={styles.activityRow}>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityName, isDark && styles.darkText]}>{activity.name}</Text>
                      <Text style={[styles.activityCount, isDark && styles.darkSubtitle]}>
                        {activity.count} sessions
                      </Text>
                    </View>
                    <View style={styles.activityTrend}>
                      <TrendingUp 
                        size={16} 
                        color={activity.trend === 'up' ? '#10B981' : activity.trend === 'down' ? '#EF4444' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.activityChange,
                        { color: activity.trend === 'up' ? '#10B981' : activity.trend === 'down' ? '#EF4444' : '#6B7280' }
                      ]}>
                        {activity.trend === 'up' ? '+' : activity.trend === 'down' ? '-' : ''}
                        {activity.change > 0 ? `${activity.change}%` : 'No change'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Weekly Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Summary</Text>
            <View style={[styles.summaryCard, isDark && styles.darkCard]}>
              <View style={styles.summaryRow}>
                <Heart size={20} color="#EF4444" />
                <View style={styles.summaryContent}>
                  <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Overall Wellbeing</Text>
                  <Text style={[styles.summaryValue, isDark && styles.darkSubtitle]}>
                    {moodData.length > 0 
                      ? `${(moodData.reduce((sum, d) => sum + d.mood, 0) / moodData.length).toFixed(1)}/10`
                      : 'No data yet'
                    }
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Target size={20} color="#10B981" />
                <View style={styles.summaryContent}>
                  <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Activities Completed</Text>
                  <Text style={[styles.summaryValue, isDark && styles.darkSubtitle]}>
                    {activities.reduce((sum, a) => sum + a.count, 0)} total
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Calendar size={20} color="#3B82F6" />
                <View style={styles.summaryContent}>
                  <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Journal Entries</Text>
                  <Text style={[styles.summaryValue, isDark && styles.darkSubtitle]}>
                    {journalStats?.totalEntries || 0} entries
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Award size={20} color="#F59E0B" />
                <View style={styles.summaryContent}>
                  <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Garden Health</Text>
                  <Text style={[styles.summaryValue, isDark && styles.darkSubtitle]}>
                    {gardenStats?.averageHealth || 0}%
                  </Text>
                </View>
              </View>
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
    backgroundColor: '#EDE9FE',
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
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  header: {
    padding: 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  scoreCard: {
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
  darkCard: {
    backgroundColor: '#374151',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  predictionCard: {
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
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  predictionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  predictionMain: {
    flex: 1,
  },
  predictionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  predictionFactors: {
    flex: 1,
    marginLeft: 16,
  },
  factorsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  factorItem: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    margin: 24,
    marginTop: 0,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  darkTimeRange: {
    backgroundColor: '#374151',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTimeRange: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkTimeRangeText: {
    color: '#9CA3AF',
  },
  activeTimeRangeText: {
    color: '#1F2937',
  },
  chartCard: {
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  chart: {
    height: 160,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkLegendText: {
    color: '#9CA3AF',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
  },
  barGroup: {
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    marginBottom: 8,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkBarLabel: {
    color: '#9CA3AF',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    margin: 24,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  advancedCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  advancedTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  advancedDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  correlationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  correlationActivity: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    flex: 1,
  },
  correlationStats: {
    alignItems: 'flex-end',
  },
  correlationImpact: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  correlationConsistency: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  streaksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakDays: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
    marginVertical: 8,
  },
  streakLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightChange: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  insightTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
  activitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  activityCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  activityTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  activityChange: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryContent: {
    marginLeft: 16,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
});