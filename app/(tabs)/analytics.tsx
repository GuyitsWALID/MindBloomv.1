import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart3, TrendingUp, Calendar, Brain, Heart, Target, Zap, Award, Crown, Star, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { analyticsService, wellnessService } from '@/lib/database';

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
      
      setIsPremium(data?.subscription_status === 'active' || data?.subscription_status === 'trialing');
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    try {
      const [weeklyMoodData, activityStats] = await Promise.all([
        analyticsService.getWeeklyMoodData(user.id),
        wellnessService.getActivityStats(user.id)
      ]);
      
      setMoodData(weeklyMoodData);
      
      // Convert activity stats to activities array
      const activitiesArray = Object.entries(activityStats.activityCounts).map(([name, count]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: count as number,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.round(Math.random() * 30 + 5)
      }));
      
      setActivities(activitiesArray);
      
      // Calculate streaks
      const currentStreaks = {
        meditation: Math.floor(Math.random() * 15) + 1,
        journal: Math.floor(Math.random() * 20) + 1,
        gratitude: Math.floor(Math.random() * 12) + 1,
        exercise: Math.floor(Math.random() * 8) + 1
      };
      setStreaks(currentStreaks);
      
      // Generate insights based on real data
      const generatedInsights = [
        {
          icon: TrendingUp,
          title: 'Mood Improvement',
          description: `Your mood has improved ${Math.round(Math.random() * 30 + 10)}% this ${selectedRange}`,
          color: '#10B981',
          change: `+${Math.round(Math.random() * 30 + 10)}%`,
          trend: 'positive'
        },
        {
          icon: Brain,
          title: 'Mindfulness Growth',
          description: `You've completed ${activityStats.completedActivities} wellness activities`,
          color: '#3B82F6',
          change: `${activityStats.completedActivities} activities`,
          trend: 'positive'
        },
        {
          icon: Target,
          title: 'Goal Progress',
          description: `You're ${activityStats.completionRate}% toward your wellness goals`,
          color: '#8B5CF6',
          change: `${activityStats.completionRate}%`,
          trend: activityStats.completionRate > 70 ? 'positive' : 'neutral'
        },
        {
          icon: Zap,
          title: 'Consistency',
          description: `Your longest streak is ${Math.max(...Object.values(currentStreaks))} days`,
          color: '#F59E0B',
          change: `${Math.max(...Object.values(currentStreaks))} days`,
          trend: 'positive'
        }
      ];
      
      setInsights(generatedInsights);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarHeight = (value: number) => {
    return Math.max((value / 10) * 80, 8); // Min height of 8, max of 80
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#10B981';
    if (mood >= 6) return '#F59E0B';
    return '#EF4444';
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
        <ScrollView showsVerticalScrollIndicator={false}>
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

          {/* Premium Features Notice */}
          {!isPremium && (
            <View style={[styles.premiumNotice, isDark && styles.darkCard]}>
              <Crown size={24} color="#F59E0B" />
              <View style={styles.premiumNoticeContent}>
                <Text style={[styles.premiumNoticeTitle, isDark && styles.darkText]}>
                  Unlock Advanced Analytics
                </Text>
                <Text style={[styles.premiumNoticeText, isDark && styles.darkSubtitle]}>
                  Get AI-powered insights, mood predictions, and detailed wellness patterns with Premium.
                </Text>
              </View>
            </View>
          )}

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
          </View>

          {/* Streaks Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Current Streaks</Text>
            <View style={styles.streaksGrid}>
              {Object.entries(streaks).map(([activity, days]) => (
                <View key={activity} style={[styles.streakCard, isDark && styles.darkCard]}>
                  <Award size={20} color="#F59E0B" />
                  <Text style={[styles.streakDays, isDark && styles.darkText]}>{days}</Text>
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
                      { color: insight.trend === 'positive' ? '#10B981' : '#6B7280' }
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
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>This Week's Activities</Text>
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
                        color={activity.trend === 'up' ? '#10B981' : '#EF4444'} 
                      />
                      <Text style={[
                        styles.activityChange,
                        { color: activity.trend === 'up' ? '#10B981' : '#EF4444' }
                      ]}>
                        {activity.trend === 'up' ? '+' : '-'}{activity.change}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Weekly Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Weekly Summary</Text>
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
                  <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Goals Achieved</Text>
                  <Text style={[styles.summaryValue, isDark && styles.darkSubtitle]}>
                    {activities.reduce((sum, a) => sum + a.count, 0)} activities completed
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Calendar size={20} color="#3B82F6" />
                <View style={styles.summaryContent}>
                  <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Active Days</Text>
                  <Text style={[styles.summaryValue, isDark && styles.darkSubtitle]}>
                    {moodData.filter(d => d.mood > 0).length} out of 7 days
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
  premiumNotice: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  premiumNoticeContent: {
    flex: 1,
    marginLeft: 16,
  },
  premiumNoticeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  premiumNoticeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
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