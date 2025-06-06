import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Sparkles, MessageCircle, Heart, Zap, Sun, Moon } from 'lucide-react-native';
import { MoodSelector } from '@/components/MoodSelector';
import { WellnessCard } from '@/components/WellnessCard';
import { AIInsight } from '@/components/AIInsight';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { moodService, wellnessService, analyticsService } from '@/lib/database';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [moodInput, setMoodInput] = useState('');
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const data = await analyticsService.getDashboardData(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFollowUpQuestions = (mood: string, input: string) => {
    const questionSets = {
      anxious: [
        "What specific situation is causing you to feel this way?",
        "Have you noticed any physical sensations with this feeling?",
        "What would help you feel more grounded right now?"
      ],
      sad: [
        "Can you tell me more about what's weighing on your heart?",
        "Is this feeling connected to something recent or ongoing?",
        "What has helped lift your spirits in the past?"
      ],
      happy: [
        "What's contributing most to this positive feeling?",
        "How can you carry this energy into the rest of your day?",
        "What would you like to celebrate about this moment?"
      ],
      tired: [
        "How has your sleep been lately?",
        "What's been demanding most of your energy?",
        "What would help you feel more refreshed?"
      ],
      neutral: [
        "What's one thing you're looking forward to today?",
        "How would you like to feel by the end of today?",
        "What small thing could brighten your mood right now?"
      ]
    };

    return questionSets[mood as keyof typeof questionSets] || questionSets.neutral;
  };

  const generatePersonalizedInsight = (mood: string, input: string, questions: string[]) => {
    const insights = {
      anxious: [
        "I notice you're feeling anxious. Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste.",
        "Anxiety often comes from worrying about the future. Let's focus on what you can control right now. Take three deep breaths with me.",
        "Your feelings are valid. Consider doing some gentle movement or stepping outside for fresh air to help calm your nervous system."
      ],
      sad: [
        "It's okay to feel sad - emotions are information. Sometimes we need to sit with difficult feelings before they can transform.",
        "Sadness can be heavy. Consider reaching out to someone you trust, or try journaling to process these feelings.",
        "You're not alone in this feeling. Small acts of self-compassion, like making tea or listening to music, can provide comfort."
      ],
      happy: [
        "I love seeing your positive energy! This is a great time to practice gratitude and maybe share this joy with others.",
        "Your happiness is wonderful. Consider what's creating this feeling so you can cultivate more of it in your life.",
        "Positive emotions are worth savoring. Take a moment to really feel this joy and let it fill your whole being."
      ],
      tired: [
        "Fatigue is your body's way of asking for care. Consider what type of rest you need - physical, mental, or emotional.",
        "Being tired isn't just about sleep. Sometimes we need to rest our minds too. A short meditation might help restore your energy.",
        "Listen to your body's wisdom. Sometimes the most productive thing we can do is rest and recharge."
      ]
    };

    const moodInsights = insights[mood as keyof typeof insights] || [
      "Thank you for sharing how you're feeling. Self-awareness is the first step toward emotional wellness.",
      "Every feeling has something to teach us. What do you think this emotion might be trying to tell you?",
      "You're taking care of your mental health by checking in with yourself. That's something to be proud of."
    ];

    return moodInsights[Math.floor(Math.random() * moodInsights.length)];
  };

  const analyzeMood = async () => {
    if (!moodInput.trim() || !user) {
      Alert.alert('Please describe how you\'re feeling');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Enhanced mood detection
      const lowerInput = moodInput.toLowerCase();
      let detectedMood = 'neutral';
      
      const moodKeywords = {
        anxious: ['anxious', 'worried', 'stressed', 'nervous', 'overwhelmed', 'panic', 'tense'],
        happy: ['happy', 'good', 'great', 'excited', 'joyful', 'amazing', 'wonderful', 'fantastic'],
        sad: ['sad', 'down', 'blue', 'depressed', 'lonely', 'empty', 'hopeless', 'disappointed'],
        tired: ['tired', 'exhausted', 'drained', 'weary', 'fatigued', 'sleepy', 'worn out'],
        calm: ['calm', 'peaceful', 'centered', 'relaxed', 'serene', 'tranquil', 'balanced']
      };

      for (const [mood, keywords] of Object.entries(moodKeywords)) {
        if (keywords.some(keyword => lowerInput.includes(keyword))) {
          detectedMood = mood;
          break;
        }
      }

      // Generate follow-up questions
      const questions = generateFollowUpQuestions(detectedMood, moodInput);
      setFollowUpQuestions(questions);

      // Generate personalized insight
      const insight = generatePersonalizedInsight(detectedMood, moodInput, questions);

      // Save mood entry to database
      await moodService.createMoodEntry({
        user_id: user.id,
        mood: detectedMood,
        description: moodInput,
        ai_insight: insight
      });

      setCurrentMood(detectedMood);
      setAiInsight(insight);
      
      // Reload dashboard data
      loadDashboardData();
      
    } catch (error) {
      console.error('Error analyzing mood:', error);
      Alert.alert('Error', 'Failed to analyze mood. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWellnessActivity = async (activityType: string, title: string) => {
    if (!user) return;

    try {
      if (activityType === 'meditation') {
        router.push('/activities/meditation');
      } else if (activityType === 'exercise') {
        router.push('/activities/energy-boost');
      } else if (activityType === 'gratitude') {
        router.push('/activities/gratitude');
      } else if (activityType === 'journal') {
        router.push('/(tabs)/journal');
      }
    } catch (error) {
      console.error('Error navigating to activity:', error);
      Alert.alert('Error', 'Failed to start activity. Please try again.');
    }
  };

  const wellnessActivities = [
    { 
      icon: Heart, 
      title: '5-Min Meditation', 
      subtitle: 'Guided breathing', 
      color: '#EF4444',
      type: 'meditation'
    },
    { 
      icon: Zap, 
      title: 'Energy Boost', 
      subtitle: 'Quick exercises', 
      color: '#F59E0B',
      type: 'exercise'
    },
    { 
      icon: Sun, 
      title: 'Gratitude Practice', 
      subtitle: 'Daily reflection', 
      color: '#EAB308',
      type: 'gratitude'
    },
    { 
      icon: MessageCircle, 
      title: 'Journal Entry', 
      subtitle: 'Write your thoughts', 
      color: '#3B82F6',
      type: 'journal'
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! 🌅';
    if (hour < 17) return 'Good afternoon! ☀️';
    return 'Good evening! 🌙';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading your wellness data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#F0FDF4', '#FFFFFF']}
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header with Theme Toggle */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, isDark && styles.darkText]}>{getGreeting()}</Text>
              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>How are you feeling today?</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              {isDark ? <Sun size={24} color="#F59E0B" /> : <Moon size={24} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          {/* Enhanced Mood Input */}
          <View style={[styles.moodInputContainer, isDark && styles.darkCard]}>
            <View style={styles.inputHeader}>
              <Brain size={24} color="#10B981" />
              <Text style={[styles.inputTitle, isDark && styles.darkText]}>Tell me about your day</Text>
            </View>
            <TextInput
              style={[styles.moodInput, isDark && styles.darkInput]}
              placeholder="I'm feeling..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={moodInput}
              onChangeText={setMoodInput}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity 
              style={[styles.analyzeButton, isAnalyzing && styles.analyzingButton]} 
              onPress={analyzeMood}
              disabled={isAnalyzing}
            >
              <Sparkles size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>
                {isAnalyzing ? 'Analyzing...' : 'Get AI Insight'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* AI Insight with Follow-up Questions */}
          {aiInsight && (
            <AIInsight 
              insight={aiInsight} 
              mood={currentMood} 
              followUpQuestions={followUpQuestions}
              isDark={isDark}
            />
          )}

          {/* Mood Selector */}
          <MoodSelector onMoodSelect={setCurrentMood} selectedMood={currentMood} isDark={isDark} />

          {/* Wellness Activities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Quick Wellness Activities</Text>
            <View style={styles.activitiesGrid}>
              {wellnessActivities.map((activity, index) => (
                <WellnessCard
                  key={index}
                  icon={activity.icon}
                  title={activity.title}
                  subtitle={activity.subtitle}
                  color={activity.color}
                  onPress={() => handleWellnessActivity(activity.type, activity.title)}
                  isDark={isDark}
                />
              ))}
            </View>
          </View>

          {/* Today's Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Today's Growth</Text>
            <View style={[styles.progressCard, isDark && styles.darkCard]}>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>
                  {dashboardData?.activityStats?.completedActivities || 0}
                </Text>
                <Text style={[styles.progressLabel, isDark && styles.darkSubtitle]}>Activities</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>
                  {dashboardData?.journalStats?.streak || 0}
                </Text>
                <Text style={[styles.progressLabel, isDark && styles.darkSubtitle]}>Streak Days</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>
                  {dashboardData?.gardenStats?.averageHealth || 0}%
                </Text>
                <Text style={[styles.progressLabel, isDark && styles.darkSubtitle]}>Garden Health</Text>
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
    backgroundColor: '#F0FDF4',
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
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 16,
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
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  moodInputContainer: {
    margin: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  moodInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  darkInput: {
    borderColor: '#4B5563',
    backgroundColor: '#1F2937',
    color: '#F9FAFB',
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  analyzingButton: {
    backgroundColor: '#9CA3AF',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
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
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});