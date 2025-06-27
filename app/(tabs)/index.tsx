import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Sparkles, MessageCircle, Heart, Zap, Sun, Moon, Mic, MicOff, Volume2, VolumeX, BookOpen, Calendar, Target } from 'lucide-react-native';
import { MoodSelector } from '@/components/MoodSelector';
import { WellnessCard } from '@/components/WellnessCard';
import { AIInsight } from '@/components/AIInsight';
import { MoodChart } from '@/components/MoodChart';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { moodService, wellnessService, analyticsService } from '@/lib/database';
import { router } from 'expo-router';

// Voice recognition interface for web
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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
  const [moodChartData, setMoodChartData] = useState<any[]>([]);
  
  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadMoodChartData();
    }
  }, [user]);

  useEffect(() => {
    // Initialize speech recognition for web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setMoodInput(prev => prev + ' ' + transcript);
          setIsListening(false);
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          Alert.alert('Voice Recognition Error', 'Please try again or type your message.');
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
        setIsVoiceSupported(true);
      }
    }
  }, []);

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

  const loadMoodChartData = async () => {
    if (!user) return;
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      const moodEntries = await moodService.getMoodEntriesForPeriod(
        user.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      const chartData = moodEntries.map(entry => ({
        date: entry.created_at,
        mood: entry.mood,
        intensity: getMoodIntensity(entry.mood)
      })).reverse();
      
      setMoodChartData(chartData);
    } catch (error) {
      console.error('Error loading mood chart data:', error);
    }
  };

  const getMoodIntensity = (mood: string): number => {
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
    return moodValues[mood] || 6;
  };

  const startVoiceRecognition = () => {
    if (!recognition || !isVoiceSupported) {
      Alert.alert('Voice Not Supported', 'Voice recognition is not available on this device.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        Alert.alert('Voice Error', 'Could not start voice recognition. Please try again.');
      }
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled || Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      // Stop any current audio
      stopSpeaking();
      
      setIsSpeaking(true);

      // Try ElevenLabs API first with deep, seductive Bateman-like voice settings
      try {
        const response = await fetch('/api/elevenlabs-tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice - deep and commanding
            voice_settings: {
              stability: 0.85,        // Very high stability for controlled, deliberate speech
              similarity_boost: 0.35, // Lower for more natural, less artificial variation
              style: 0.45,           // Enhanced style for sophistication and depth
              use_speaker_boost: true // Enhanced clarity and presence
            }
          }),
        });

        if (response.ok) {
          // Get the audio as array buffer
          const audioArrayBuffer = await response.arrayBuffer();
          
          // Create a proper blob with explicit MIME type
          const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Create and configure audio element
          const audio = new Audio();
          setCurrentAudio(audio);

          // Set up event handlers before setting src
          audio.onended = () => {
            setIsSpeaking(false);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = (e) => {
            console.warn('ElevenLabs audio failed, falling back to browser TTS');
            setIsSpeaking(false);
            setCurrentAudio(null);
            URL.revokeObjectURL(audioUrl);
            // Fallback to browser TTS
            fallbackToWebSpeech(text);
          };

          audio.oncanplaythrough = () => {
            audio.play().catch(() => {
              console.warn('Audio play failed, falling back to browser TTS');
              fallbackToWebSpeech(text);
            });
          };

          // Set the source and load
          audio.src = audioUrl;
          audio.load();
        } else {
          throw new Error('ElevenLabs API failed');
        }
      } catch (error) {
        console.warn('ElevenLabs TTS failed, using browser fallback:', error);
        fallbackToWebSpeech(text);
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  const fallbackToWebSpeech = (text: string) => {
    if (window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      // Optimize browser TTS for deep, commanding delivery
      utterance.rate = 0.65;    // Slower for more deliberate, controlled speech
      utterance.pitch = 0.75;   // Lower pitch for deeper, more authoritative voice
      utterance.volume = 0.9;   // Higher volume for presence
      
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    // Stop HTML audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    
    // Stop browser speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
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
      
      // Speak the AI insight if voice is enabled
      if (voiceEnabled) {
        speakText(insight);
      }
      
      // Reload dashboard data and mood chart
      loadDashboardData();
      loadMoodChartData();
      
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
      icon: BookOpen, 
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
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]} // Increased padding for compact footer
        >
          {/* Header with Theme Toggle */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, isDark && styles.darkText]}>{getGreeting()}</Text>
              <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>How are you feeling today?</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, isDark && styles.darkThemeToggle]}>
              {isDark ? <Sun size={24} color="#F59E0B" /> : <Moon size={24} color="#6B7280" />}
            </TouchableOpacity>
          </View>

          {/* Enhanced Mood Input with Voice */}
          <View style={[styles.moodInputContainer, isDark && styles.darkCard]}>
            <View style={styles.inputHeader}>
              <Brain size={24} color="#10B981" />
              <Text style={[styles.inputTitle, isDark && styles.darkText]}>Tell me about your day</Text>
              <View style={styles.voiceControls}>
                {isSpeaking && (
                  <TouchableOpacity onPress={stopSpeaking} style={styles.voiceButton}>
                    <VolumeX size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => setVoiceEnabled(!voiceEnabled)} 
                  style={[styles.voiceButton, !voiceEnabled && styles.voiceButtonDisabled]}
                >
                  {voiceEnabled ? (
                    <Volume2 size={20} color="#10B981" />
                  ) : (
                    <VolumeX size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
                {isVoiceSupported && (
                  <TouchableOpacity 
                    style={[styles.micButton, isListening && styles.micButtonActive]}
                    onPress={startVoiceRecognition}
                  >
                    {isListening ? (
                      <MicOff size={20} color="#FFFFFF" />
                    ) : (
                      <Mic size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            <TextInput
              style={[styles.moodInput, isDark && styles.darkInput]}
              placeholder="I'm feeling... (type or speak)"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={moodInput}
              onChangeText={setMoodInput}
              multiline
              numberOfLines={3}
            />
            
            {isListening && (
              <Text style={[styles.listeningText, isDark && styles.darkSubtitle]}>
                🎤 Listening... Speak now
              </Text>
            )}
            
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

          {/* Mood Chart */}
          {moodChartData.length > 0 && (
            <View style={styles.section}>
              <MoodChart data={moodChartData} isDark={isDark} />
            </View>
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
                <Calendar size={20} color="#10B981" />
                <View style={styles.progressContent}>
                  <Text style={[styles.progressLabel, isDark && styles.darkText]}>Activities</Text>
                  <Text style={[styles.progressNumber, isDark && styles.darkSubtitle]}>
                    {dashboardData?.activityStats?.completedActivities || 0}
                  </Text>
                </View>
              </View>
              <View style={styles.progressItem}>
                <Target size={20} color="#F59E0B" />
                <View style={styles.progressContent}>
                  <Text style={[styles.progressLabel, isDark && styles.darkText]}>Streak Days</Text>
                  <Text style={[styles.progressNumber, isDark && styles.darkSubtitle]}>
                    {dashboardData?.journalStats?.streak || 0}
                  </Text>
                </View>
              </View>
              <View style={styles.progressItem}>
                <Heart size={20} color="#EF4444" />
                <View style={styles.progressContent}>
                  <Text style={[styles.progressLabel, isDark && styles.darkText]}>Garden Health</Text>
                  <Text style={[styles.progressNumber, isDark && styles.darkSubtitle]}>
                    {dashboardData?.gardenStats?.averageHealth || 0}%
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
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  darkThemeToggle: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
  },
  moodInputContainer: {
    margin: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  voiceButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  moodInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
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
  listeningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    fontSize: 22,
    fontFamily: 'Inter-Bold',
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
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressContent: {
    marginLeft: 16,
    flex: 1,
  },
  progressLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressNumber: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
});