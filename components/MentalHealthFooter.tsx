import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Switch, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Activity, TrendingUp, BookOpen, Phone, Wind, Moon, Pill, Plus, X, Calendar, Clock, TriangleAlert as AlertTriangle, ChartBar as BarChart3, Smile, Frown, Meh, Zap, Cloud, Sun, Chrome as Home, Flower, User, Crown, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { Audio } from '@/lib/audio';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { moodService, journalService } from '@/lib/database';
import { router, usePathname } from 'expo-router';

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  symptoms: string[];
  notes: string;
  timestamp: string;
}

interface SymptomEntry {
  id: string;
  symptom: string;
  severity: number;
  timestamp: string;
  notes: string;
}

interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  taken: boolean;
  timestamp: string;
}

interface NotificationSettings {
  dailyReminders: boolean;
  weeklyReports: boolean;
  achievementAlerts: boolean;
  moodCheckIns: boolean;
}

const MOOD_OPTIONS = [
  { id: 'excellent', label: 'Excellent', icon: Sun, color: '#10B981', emoji: '😊' },
  { id: 'good', label: 'Good', icon: Smile, color: '#22C55E', emoji: '🙂' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: '#6B7280', emoji: '😐' },
  { id: 'low', label: 'Low', icon: Cloud, color: '#F59E0B', emoji: '😔' },
  { id: 'poor', label: 'Poor', icon: Frown, color: '#EF4444', emoji: '😢' },
];

const COMMON_SYMPTOMS = [
  'Anxiety', 'Depression', 'Fatigue', 'Insomnia', 'Irritability',
  'Panic', 'Stress', 'Mood Swings', 'Concentration Issues', 'Social Withdrawal'
];

const CRISIS_RESOURCES = [
  { name: 'National Suicide Prevention Lifeline', number: '988', available: '24/7' },
  { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
  { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: '24/7' },
  { name: 'Emergency Services', number: '911', available: '24/7' },
];

const BREATHING_EXERCISES = [
  { name: '4-7-8 Breathing', description: 'Inhale 4, hold 7, exhale 8', duration: '2-3 minutes' },
  { name: 'Box Breathing', description: 'Inhale 4, hold 4, exhale 4, hold 4', duration: '5 minutes' },
  { name: 'Deep Belly Breathing', description: 'Slow, deep breaths into your belly', duration: '3-5 minutes' },
];

export function MentalHealthFooter() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const pathname = usePathname();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandAnimation] = useState(new Animated.Value(0));

  // Modal states
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [newSymptom, setNewSymptom] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState(5);
  const [notifications, setNotifications] = useState<NotificationSettings>({
    dailyReminders: true,
    weeklyReports: true,
    achievementAlerts: true,
    moodCheckIns: true,
  });

  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [recognition,  setRecognition] = useState<SpeechRecognition | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | Audio.Sound | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    Animated.timing(expandAnimation, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    // Initialize speech recognition only for web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setNotes(prev => prev + ' ' + transcript);
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
    } else {
      // For mobile platforms, voice recognition is not supported without custom development build
      setIsVoiceSupported(false);
    }
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Load recent mood entries
      const recentMoods = await moodService.getMoodEntries(user.id, 7);
      setMoodEntries(recentMoods.map(entry => ({
        id: entry.id,
        mood: entry.mood,
        intensity: 5, // Default intensity
        symptoms: [],
        notes: entry.description || '',
        timestamp: entry.created_at
      })));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  const startVoiceRecognition = async () => {
    if (!isVoiceSupported) {
      Alert.alert('Voice Not Supported', 'Voice recognition requires a custom development build for mobile devices.');
      return;
    }

    if (isListening) {
      if (Platform.OS === 'web' && recognition) {
        recognition.stop();
      }
      setIsListening(false);
    } else {
      try {
        if (Platform.OS === 'web' && recognition) {
          recognition.start();
          setIsListening(true);
        }
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        Alert.alert('Voice Error', 'Could not start voice recognition. Please try again.');
      }
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled) return;

    try {
      // Stop any current audio
      await stopSpeaking();
      
      setIsSpeaking(true);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web implementation with ElevenLabs API
        try {
          const apiUrl = process.env.EXPO_PUBLIC_DOMAIN 
            ? `${process.env.EXPO_PUBLIC_DOMAIN}/api/elevenlabs-tts`
            : '/api/elevenlabs-tts';

          const response = await fetch(apiUrl, {
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
      } else {
        // Mobile implementation - fallback to native TTS only
        fallbackToNativeTTS(text);
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
    }
  };

  const fallbackToWebSpeech = (text: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
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

  const fallbackToNativeTTS = (text: string) => {
    // For mobile platforms, use a simple text display instead of TTS
    // since ElevenLabs API is not accessible and native TTS requires additional setup
    Alert.alert('AI Insight', text);
    setIsSpeaking(false);
  };

  const stopSpeaking = async () => {
    if (Platform.OS === 'web') {
      // Stop HTML audio
      if (currentAudio && currentAudio instanceof HTMLAudioElement) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      // Stop browser speech synthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Stop expo-av sound
      if (currentAudio && typeof (currentAudio as any).stopAsync === 'function') {
        try {
          await (currentAudio as Audio.Sound).stopAsync();
          await (currentAudio as Audio.Sound).unloadAsync();
        } catch (error) {
          console.warn('Error stopping mobile audio:', error);
        }
      }
    }
    
    setCurrentAudio(null);
    setIsSpeaking(false);
  };

  const saveMoodEntry = async () => {
    if (!user || !selectedMood) return;

    try {
      const entry = {
        user_id: user.id,
        mood: selectedMood,
        description: `Intensity: ${moodIntensity}/10. Symptoms: ${selectedSymptoms.join(', ')}. Notes: ${notes}`,
        ai_insight: generateMoodInsight(selectedMood, moodIntensity, selectedSymptoms)
      };

      await moodService.createMoodEntry(entry);
      
      // Add to local state
      const newEntry: MoodEntry = {
        id: Date.now().toString(),
        mood: selectedMood,
        intensity: moodIntensity,
        symptoms: selectedSymptoms,
        notes,
        timestamp: new Date().toISOString()
      };
      
      setMoodEntries(prev => [newEntry, ...prev.slice(0, 6)]);
      
      // Reset form
      setSelectedMood('');
      setMoodIntensity(5);
      setSelectedSymptoms([]);
      setNotes('');
      setActiveModal(null);
      
      Alert.alert('Mood Logged', 'Your mood has been recorded successfully.');
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Failed to save mood entry.');
    }
  };

  const saveSymptomEntry = async () => {
    if (!newSymptom.trim()) return;

    const entry: SymptomEntry = {
      id: Date.now().toString(),
      symptom: newSymptom,
      severity: symptomSeverity,
      timestamp: new Date().toISOString(),
      notes
    };

    setSymptoms(prev => [entry, ...prev.slice(0, 9)]);
    setNewSymptom('');
    setSymptomSeverity(5);
    setNotes('');
    setActiveModal(null);
    
    Alert.alert('Symptom Tracked', 'Your symptom has been recorded.');
  };

  const generateMoodInsight = (mood: string, intensity: number, symptoms: string[]) => {
    if (intensity <= 3) {
      return "Consider reaching out to a mental health professional or trusted friend. Remember that difficult feelings are temporary.";
    } else if (intensity >= 8) {
      return "Great to see you're feeling positive! Try to identify what's contributing to this good mood.";
    } else {
      return "Your mood seems balanced today. Continue with your self-care practices.";
    }
  };

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  const getActiveRoute = () => {
    if (pathname === '/') return 'home';
    if (pathname.includes('/garden')) return 'garden';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/premium')) return 'premium';
    if (pathname.includes('/profile')) return 'profile';
    return 'home';
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // In a real app, this would save to the backend
  };

  const renderMoodModal = () => (
    <Modal visible={activeModal === 'mood'} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Log Your Mood</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>How are you feeling?</Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodOption,
                    isDark && styles.darkMoodOption,
                    selectedMood === mood.id && { backgroundColor: mood.color + '20', borderColor: mood.color }
                  ]}
                  onPress={() => setSelectedMood(mood.id)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, isDark && styles.darkText]}>{mood.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Intensity (1-10)</Text>
            <View style={styles.intensitySlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.intensityButton,
                    moodIntensity === num && styles.selectedIntensity
                  ]}
                  onPress={() => setMoodIntensity(num)}
                >
                  <Text style={[
                    styles.intensityText,
                    moodIntensity === num && styles.selectedIntensityText
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Symptoms (optional)</Text>
            <View style={styles.symptomsGrid}>
              {COMMON_SYMPTOMS.map((symptom) => (
                <TouchableOpacity
                  key={symptom}
                  style={[
                    styles.symptomChip,
                    isDark && styles.darkSymptomChip,
                    selectedSymptoms.includes(symptom) && styles.selectedSymptom
                  ]}
                  onPress={() => {
                    setSelectedSymptoms(prev =>
                      prev.includes(symptom)
                        ? prev.filter(s => s !== symptom)
                        : [...prev, symptom]
                    );
                  }}
                >
                  <Text style={[
                    styles.symptomText,
                    isDark && styles.darkText,
                    selectedSymptoms.includes(symptom) && styles.selectedSymptomText
                  ]}>{symptom}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Notes</Text>
            <View style={styles.notesInputContainer}>
              <TextInput
                style={[styles.notesInput, isDark && styles.darkInput]}
                placeholder="Any additional thoughts or context..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              
              {isVoiceSupported && (
                <TouchableOpacity 
                  style={[styles.micButton, isListening && styles.micButtonActive]}
                  onPress={startVoiceRecognition}
                >
                  {isListening ? (
                    <X size={16} color="#FFFFFF" />
                  ) : (
                    <Mic size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {isListening && (
              <Text style={[styles.listeningText, isDark && styles.darkSubtitle]}>
                🎤 Listening... Speak now
              </Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, !selectedMood && styles.disabledButton]}
              onPress={saveMoodEntry}
              disabled={!selectedMood}
            >
              <Text style={styles.saveButtonText}>Save Mood Entry</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSymptomModal = () => (
    <Modal visible={activeModal === 'symptoms'} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Track Symptoms</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Symptom</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Enter symptom..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={newSymptom}
              onChangeText={setNewSymptom}
            />

            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Severity (1-10)</Text>
            <View style={styles.intensitySlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.intensityButton,
                    symptomSeverity === num && styles.selectedIntensity
                  ]}
                  onPress={() => setSymptomSeverity(num)}
                >
                  <Text style={[
                    styles.intensityText,
                    symptomSeverity === num && styles.selectedIntensityText
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Notes</Text>
            <View style={styles.notesInputContainer}>
              <TextInput
                style={[styles.notesInput, isDark && styles.darkInput]}
                placeholder="Additional details about this symptom..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
              
              {isVoiceSupported && (
                <TouchableOpacity 
                  style={[styles.micButton, isListening && styles.micButtonActive]}
                  onPress={startVoiceRecognition}
                >
                  {isListening ? (
                    <X size={16} color="#FFFFFF" />
                  ) : (
                    <Mic size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {isListening && (
              <Text style={[styles.listeningText, isDark && styles.darkSubtitle]}>
                🎤 Listening... Speak now
              </Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, !newSymptom.trim() && styles.disabledButton]}
              onPress={saveSymptomEntry}
              disabled={!newSymptom.trim()}
            >
              <Text style={styles.saveButtonText}>Save Symptom</Text>
            </TouchableOpacity>

            {symptoms.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Recent Symptoms</Text>
                {symptoms.slice(0, 3).map((symptom) => (
                  <View key={symptom.id} style={[styles.recentItem, isDark && styles.darkRecentItem]}>
                    <Text style={[styles.recentSymptom, isDark && styles.darkText]}>{symptom.symptom}</Text>
                    <Text style={[styles.recentSeverity, { color: symptom.severity > 7 ? '#EF4444' : symptom.severity > 4 ? '#F59E0B' : '#10B981' }]}>
                      {symptom.severity}/10
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderProgressModal = () => (
    <Modal visible={activeModal === 'progress'} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Progress Overview</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.progressSection}>
              <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Mood Trends (Last 7 Days)</Text>
              <View style={styles.moodChart}>
                {moodEntries.slice(0, 7).map((entry, index) => {
                  const moodOption = MOOD_OPTIONS.find(m => m.id === entry.mood);
                  return (
                    <View key={entry.id} style={styles.chartBar}>
                      <View
                        style={[
                          styles.moodBar,
                          {
                            height: (entry.intensity / 10) * 80,
                            backgroundColor: moodOption?.color || '#6B7280'
                          }
                        ]}
                      />
                      <Text style={[styles.chartLabel, isDark && styles.darkText]}>
                        {new Date(entry.timestamp).getDate()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, isDark && styles.darkStatCard]}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>
                  {moodEntries.length > 0 ? Math.round(moodEntries.reduce((sum, entry) => sum + entry.intensity, 0) / moodEntries.length) : 0}
                </Text>
                <Text style={[styles.statLabel, isDark && styles.darkText]}>Avg Mood</Text>
              </View>
              <View style={[styles.statCard, isDark && styles.darkStatCard]}>
                <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{moodEntries.length}</Text>
                <Text style={[styles.statLabel, isDark && styles.darkText]}>Entries</Text>
              </View>
              <View style={[styles.statCard, isDark && styles.darkStatCard]}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{symptoms.length}</Text>
                <Text style={[styles.statLabel, isDark && styles.darkText]}>Symptoms</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCrisisModal = () => (
    <Modal visible={activeModal === 'crisis'} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Crisis Resources</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[styles.emergencyBanner, isDark && styles.darkEmergencyBanner]}>
              <AlertTriangle size={24} color="#EF4444" />
              <Text style={[styles.emergencyText, isDark && styles.darkText]}>
                If you're in immediate danger, call 911
              </Text>
            </View>

            {CRISIS_RESOURCES.map((resource, index) => (
              <View key={index} style={[styles.resourceCard, isDark && styles.darkResourceCard]}>
                <View style={styles.resourceHeader}>
                  <Phone size={20} color="#10B981" />
                  <Text style={[styles.resourceName, isDark && styles.darkText]}>{resource.name}</Text>
                </View>
                <Text style={[styles.resourceNumber, { color: '#10B981' }]}>{resource.number}</Text>
                <Text style={[styles.resourceAvailable, isDark && styles.darkText]}>Available: {resource.available}</Text>
              </View>
            ))}

            <View style={styles.breathingSection}>
              <Text style={[styles.sectionLabel, isDark && styles.darkText]}>Quick Breathing Exercises</Text>
              {BREATHING_EXERCISES.map((exercise, index) => (
                <View key={index} style={[styles.exerciseCard, isDark && styles.darkExerciseCard]}>
                  <Wind size={20} color="#3B82F6" />
                  <View style={styles.exerciseContent}>
                    <Text style={[styles.exerciseName, isDark && styles.darkText]}>{exercise.name}</Text>
                    <Text style={[styles.exerciseDescription, isDark && styles.darkText]}>{exercise.description}</Text>
                    <Text style={[styles.exerciseDuration, isDark && styles.darkText]}>Duration: {exercise.duration}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBreathingModal = () => (
    <Modal visible={activeModal === 'breathing'} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Breathing Exercises</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.breathingIntro, isDark && styles.darkText]}>
              Take a moment to center yourself with these guided breathing exercises. Find a comfortable position and follow along.
            </Text>

            {BREATHING_EXERCISES.map((exercise, index) => (
              <TouchableOpacity key={index} style={[styles.breathingExerciseCard, isDark && styles.darkExerciseCard]}>
                <View style={styles.exerciseHeader}>
                  <Wind size={24} color="#3B82F6" />
                  <Text style={[styles.exerciseName, isDark && styles.darkText]}>{exercise.name}</Text>
                </View>
                <Text style={[styles.exerciseDescription, isDark && styles.darkText]}>{exercise.description}</Text>
                <View style={styles.exerciseFooter}>
                  <Text style={[styles.exerciseDuration, isDark && styles.darkText]}>{exercise.duration}</Text>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>Start</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const navigationItems = [
    { id: 'home', icon: Home, label: 'Home', route: '/', color: '#3B82F6' },
    { id: 'garden', icon: Flower, label: 'Garden', route: '/garden', color: '#10B981' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', route: '/analytics', color: '#8B5CF6' },
    { id: 'premium', icon: Crown, label: 'Premium', route: '/premium', color: '#F59E0B' },
    { id: 'profile', icon: User, label: 'Profile', route: '/profile', color: '#EF4444' },
  ];

  const mentalHealthItems = [
    { id: 'mood', icon: Heart, label: 'Mood', color: '#EF4444' },
    { id: 'symptoms', icon: Activity, label: 'Symptoms', color: '#F59E0B' },
    { id: 'progress', icon: TrendingUp, label: 'Progress', color: '#10B981' },
    { id: 'crisis', icon: Phone, label: 'Crisis', color: '#8B5CF6' },
    { id: 'breathing', icon: Wind, label: 'Breathe', color: '#06B6D4' },
  ];

  const activeRoute = getActiveRoute();

  const expandedHeight = expandAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80], // Reduced height for compact design
  });

  return (
    <>
      <View style={[styles.footer, isDark && styles.darkFooter]}>
        {/* Expandable Mental Health Tools Section - NOW AT TOP */}
        <View style={styles.mentalHealthSection}>
          <TouchableOpacity style={styles.expandToggle} onPress={toggleExpansion}>
            <Text style={[styles.expandToggleText, isDark && styles.darkExpandToggleText]}>
              🧠 Mental Health Tools
            </Text>
            {isExpanded ? (
              <ChevronDown size={14} color={isDark ? '#94A3B8' : '#64748B'} />
            ) : (
              <ChevronUp size={14} color={isDark ? '#94A3B8' : '#64748B'} />
            )}
          </TouchableOpacity>

          <Animated.View style={[styles.expandableContent, { height: expandedHeight }]}>
            <View style={styles.mentalHealthContent}>
              {mentalHealthItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.mentalHealthItem}
                  onPress={() => setActiveModal(item.id)}
                >
                  <View style={[styles.mentalHealthIconContainer, { backgroundColor: item.color + '20' }]}>
                    <item.icon size={14} color={item.color} />
                  </View>
                  <Text style={[styles.mentalHealthLabel, isDark && styles.darkMentalHealthLabel]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Main Navigation Section - NOW BELOW */}
        <View style={styles.navigationSection}>
          <View style={styles.navigationContent}>
            {navigationItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  activeRoute === item.id && styles.activeNavItem
                ]}
                onPress={() => handleNavigation(item.route)}
              >
                <View style={[
                  styles.navIconContainer,
                  { backgroundColor: activeRoute === item.id ? item.color : 'transparent' }
                ]}>
                  <item.icon 
                    size={18} 
                    color={activeRoute === item.id ? '#FFFFFF' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)')} 
                  />
                </View>
                <Text style={[
                  styles.navLabel,
                  isDark && styles.darkNavLabel,
                  activeRoute === item.id && { color: item.color, fontWeight: '600' }
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {renderMoodModal()}
      {renderSymptomModal()}
      {renderProgressModal()}
      {renderCrisisModal()}
      {renderBreathingModal()}
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 12,
  },
  darkFooter: {
    backgroundColor: '#1E293B',
    borderTopColor: '#334155',
  },
  mentalHealthSection: {
    marginBottom: 8,
  },
  navigationSection: {
    // No additional margin needed
  },
  navigationContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minWidth: 56,
  },
  activeNavItem: {
    transform: [{ scale: 1.05 }],
  },
  navIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    textAlign: 'center',
  },
  darkNavLabel: {
    color: '#94A3B8',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  expandToggleText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginRight: 6,
  },
  darkExpandToggleText: {
    color: '#60A5FA',
  },
  expandableContent: {
    overflow: 'hidden',
  },
  mentalHealthContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  mentalHealthItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minWidth: 52,
  },
  mentalHealthIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  mentalHealthLabel: {
    fontSize: 9,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  darkMentalHealthLabel: {
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  darkModalContent: {
    backgroundColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  moodOption: {
    width: '30%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  darkMoodOption: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  intensitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  intensityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIntensity: {
    backgroundColor: '#10B981',
  },
  intensityText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  selectedIntensityText: {
    color: '#FFFFFF',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  symptomChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  darkSymptomChip: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  selectedSymptom: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  symptomText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  selectedSymptomText: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginBottom: 16,
  },
  darkInput: {
    borderColor: '#4B5563',
    backgroundColor: '#374151',
    color: '#F9FAFB',
  },
  notesInputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingRight: 50, // Space for the mic button
  },
  micButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  listeningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  recentSection: {
    marginTop: 24,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  darkRecentItem: {
    backgroundColor: '#374151',
  },
  recentSymptom: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  recentSeverity: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  progressSection: {
    marginBottom: 24,
  },
  moodChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  chartBar: {
    alignItems: 'center',
  },
  moodBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  darkStatCard: {
    backgroundColor: '#374151',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  darkEmergencyBanner: {
    backgroundColor: '#7F1D1D',
    borderColor: '#991B1B',
  },
  emergencyText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 12,
  },
  resourceCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  darkResourceCard: {
    backgroundColor: '#374151',
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  resourceNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  resourceAvailable: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  breathingSection: {
    marginTop: 24,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  darkExerciseCard: {
    backgroundColor: '#374151',
  },
  exerciseContent: {
    marginLeft: 12,
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  exerciseDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  breathingIntro: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  breathingExerciseCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  startButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});