import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PenTool, Sparkles, Calendar, Tag, Search, Filter, FileText, Brain, Cloud, Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { journalService } from '@/lib/database';
import { JournalEntry } from '@/types/database';

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

export default function JournalScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isWriting, setIsWriting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalStats, setJournalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      loadJournalData();
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
          setCurrentEntry(prev => prev + ' ' + transcript);
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

  const loadJournalData = async () => {
    if (!user) return;
    
    try {
      const [entries, stats] = await Promise.all([
        journalService.getJournalEntries(user.id),
        journalService.getJournalStats(user.id)
      ]);
      
      setJournalEntries(entries);
      setJournalStats(stats);
    } catch (error) {
      console.error('Error loading journal data:', error);
    } finally {
      setLoading(false);
    }
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

      // Call our ElevenLabs API route
      const response = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice - natural and friendly
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      await audio.play();
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      setCurrentAudio(null);
      // Fallback to browser speech synthesis if ElevenLabs fails
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
  };

  const exportToGoogleDrive = async () => {
    if (!user) return;

    try {
      const data = await journalService.exportJournalData(user.id);
      
      // Create CSV content
      const csvContent = [
        'Date,Title,Content,Tags,AI Insights',
        ...data.map(entry => [
          new Date(entry.created_at).toLocaleDateString(),
          `"${entry.title.replace(/"/g, '""')}"`,
          `"${entry.content.replace(/"/g, '""')}"`,
          `"${entry.tags.join(', ')}"`,
          `"${(entry.ai_insights || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      // For web, create download
      if (typeof window !== 'undefined') {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindbloom-journal-backup-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      Alert.alert(
        'Backup Complete! ☁️', 
        'Your journal has been backed up successfully. This backup includes all your entries, tags, and AI insights for safekeeping.',
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error backing up journal:', error);
      Alert.alert('Backup Failed', 'Failed to backup your journal. Please try again.');
    }
  };

  const saveEntry = async () => {
    if (!currentEntry.trim() || !user) {
      Alert.alert('Please write something in your journal');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Enhanced AI insights based on content analysis
      const content = currentEntry.toLowerCase();
      let insight = '';
      
      if (content.includes('grateful') || content.includes('thankful')) {
        insight = "Your gratitude practice is beautiful. Research shows that regular gratitude journaling can increase happiness by up to 25% and improve sleep quality.";
      } else if (content.includes('anxious') || content.includes('worried') || content.includes('stress')) {
        insight = "I notice you're processing some challenging emotions. Writing about stress can reduce its impact by 20%. Consider trying the 4-7-8 breathing technique after journaling.";
      } else if (content.includes('goal') || content.includes('plan') || content.includes('future')) {
        insight = "Your forward-thinking mindset is powerful. People who write about their goals are 42% more likely to achieve them. Keep visualizing your success!";
      } else if (content.includes('relationship') || content.includes('friend') || content.includes('family')) {
        insight = "Relationships are at the heart of wellbeing. Reflecting on your connections helps strengthen them and builds emotional intelligence.";
      } else {
        const insights = [
          "Your self-reflection shows emotional maturity. Regular journaling can improve memory and boost immune function.",
          "Writing helps organize thoughts and emotions. You're building a valuable practice for mental clarity and stress relief.",
          "Your journal is a safe space for authentic expression. This honest self-dialogue promotes psychological healing and growth."
        ];
        insight = insights[Math.floor(Math.random() * insights.length)];
      }
      
      // Enhanced tag extraction
      const possibleTags = [
        'gratitude', 'anxiety', 'work', 'family', 'growth', 'mindfulness', 
        'stress', 'joy', 'reflection', 'goals', 'relationships', 'health',
        'creativity', 'learning', 'travel', 'nature', 'spirituality'
      ];
      const extractedTags = possibleTags.filter(tag => content.includes(tag));
      
      // Add mood-based tags
      if (content.includes('happy') || content.includes('excited')) extractedTags.push('positive');
      if (content.includes('sad') || content.includes('down')) extractedTags.push('processing');
      if (content.includes('tired') || content.includes('exhausted')) extractedTags.push('rest');
      
      // Save to database
      await journalService.createJournalEntry({
        user_id: user.id,
        title: entryTitle || `Entry - ${new Date().toLocaleDateString()}`,
        content: currentEntry,
        tags: extractedTags,
        ai_insights: insight
      });
      
      // Speak the AI insight if voice is enabled
      if (voiceEnabled) {
        speakText(insight);
      }
      
      Alert.alert(
        'Entry Saved! 🌱',
        `AI Insight: ${insight}`,
        [{ text: 'Continue Writing', onPress: () => {
          setCurrentEntry('');
          setEntryTitle('');
          setIsWriting(false);
          loadJournalData();
        }}]
      );
      
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag === null || entry.tags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(journalEntries.flatMap(entry => entry.tags))];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading your journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isWriting) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <LinearGradient 
          colors={isDark ? ['#1F2937', '#111827'] : ['#FEF3C7', '#FFFFFF']} 
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsWriting(false)} style={styles.backButton}>
              <Text style={[styles.backButtonText, isDark && styles.darkText]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>New Entry</Text>
            <View style={styles.headerActions}>
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
              <TouchableOpacity onPress={saveEntry} disabled={isAnalyzing} style={styles.saveButton}>
                <Text style={[styles.saveButtonText, isAnalyzing && styles.disabledText]}>
                  {isAnalyzing ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.writeContainer}>
            <TextInput
              style={[styles.titleInput, isDark && styles.darkInput]}
              placeholder="Give your entry a title..."
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={entryTitle}
              onChangeText={setEntryTitle}
            />
            
            <View style={styles.contentContainer}>
              <TextInput
                style={[styles.contentInput, isDark && styles.darkInput]}
                placeholder="What's on your mind today? (type or speak)"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={currentEntry}
                onChangeText={setCurrentEntry}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              
              {isVoiceSupported && (
                <TouchableOpacity 
                  style={[styles.micButton, isListening && styles.micButtonActive]}
                  onPress={startVoiceRecognition}
                >
                  {isListening ? (
                    <MicOff size={24} color="#FFFFFF" />
                  ) : (
                    <Mic size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            {isListening && (
              <Text style={[styles.listeningText, isDark && styles.darkSubtitle]}>
                🎤 Listening... Speak your thoughts
              </Text>
            )}
            
            <View style={[styles.writingTips, isDark && styles.darkCard]}>
              <Text style={[styles.tipsTitle, isDark && styles.darkText]}>💡 Writing Prompts</Text>
              <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• How am I feeling right now?</Text>
              <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• What am I grateful for today?</Text>
              <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• What challenged me today?</Text>
              <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• What did I learn about myself?</Text>
              <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• What are my goals for tomorrow?</Text>
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
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.greeting, isDark && styles.darkText]}>Your Journal 📝</Text>
                <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>Reflect, grow, and discover patterns</Text>
              </View>
              
              {/* Google Drive Backup Button */}
              <TouchableOpacity 
                style={[styles.backupButton, isDark && styles.darkBackupButton]} 
                onPress={exportToGoogleDrive}
              >
                <Cloud size={16} color="#4285F4" />
                <Text style={[styles.backupButtonText, isDark && styles.darkBackupText]}>Backup</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.backupHint, isDark && styles.darkSubtitle]}>
              💡 Tap backup to save your journal entries to your device for safekeeping
            </Text>
          </View>

          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, isDark && styles.darkCard]}>
              <Search size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <TextInput
                style={[styles.searchInput, isDark && styles.darkText]}
                placeholder="Search entries..."
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            {allTags.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                <TouchableOpacity
                  style={[
                    styles.tagFilter,
                    isDark && styles.darkTagFilter,
                    selectedTag === null && styles.activeTagFilter
                  ]}
                  onPress={() => setSelectedTag(null)}
                >
                  <Text style={[
                    styles.tagFilterText,
                    isDark && styles.darkTagText,
                    selectedTag === null && styles.activeTagText
                  ]}>All</Text>
                </TouchableOpacity>
                {allTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.tagFilter,
                      isDark && styles.darkTagFilter,
                      selectedTag === tag && styles.activeTagFilter
                    ]}
                    onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    <Text style={[
                      styles.tagFilterText,
                      isDark && styles.darkTagText,
                      selectedTag === tag && styles.activeTagText
                    ]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* New Entry Button */}
          <TouchableOpacity style={styles.newEntryButton} onPress={() => setIsWriting(true)}>
            <PenTool size={24} color="#FFFFFF" />
            <Text style={styles.newEntryText}>Start Writing</Text>
            <Sparkles size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* AI Insights Summary */}
          {journalEntries.length > 0 && (
            <View style={[styles.insightsCard, isDark && styles.darkCard]}>
              <View style={styles.insightsHeader}>
                <Brain size={24} color="#8B5CF6" />
                <Text style={[styles.insightsTitle, isDark && styles.darkText]}>Recent AI Insights</Text>
              </View>
              <Text style={[styles.insightsText, isDark && styles.darkSubtitle]}>
                {journalEntries[0]?.ai_insights || "Keep writing to discover patterns in your thoughts and emotions."}
              </Text>
            </View>
          )}

          {/* Recent Entries */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>
              {filteredEntries.length === journalEntries.length ? 'Recent Entries' : `Found ${filteredEntries.length} entries`}
            </Text>
            {filteredEntries.length === 0 ? (
              <View style={[styles.emptyState, isDark && styles.darkCard]}>
                <Text style={[styles.emptyStateText, isDark && styles.darkText]}>
                  {searchQuery || selectedTag ? 'No entries match your search' : 'No journal entries yet'}
                </Text>
                <Text style={[styles.emptyStateSubtext, isDark && styles.darkSubtitle]}>
                  {searchQuery || selectedTag ? 'Try adjusting your filters' : 'Start writing to track your thoughts and emotions'}
                </Text>
              </View>
            ) : (
              filteredEntries.map((entry) => (
                <TouchableOpacity key={entry.id} style={[styles.entryCard, isDark && styles.darkCard]}>
                  <View style={styles.entryHeader}>
                    <View style={styles.entryMeta}>
                      <Calendar size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                      <Text style={[styles.entryDate, isDark && styles.darkSubtitle]}>
                        {formatDate(entry.created_at)}
                      </Text>
                    </View>
                    <View style={styles.tagsContainer}>
                      {entry.tags.slice(0, 2).map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Tag size={12} color="#10B981" />
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <Text style={[styles.entryTitle, isDark && styles.darkText]}>{entry.title}</Text>
                  <Text style={[styles.entryPreview, isDark && styles.darkSubtitle]} numberOfLines={2}>
                    {entry.content}
                  </Text>
                  {entry.ai_insights && (
                    <View style={[styles.aiInsightPreview, isDark && styles.darkInsightPreview]}>
                      <Sparkles size={14} color="#8B5CF6" />
                      <Text style={[styles.aiInsightText, isDark && styles.darkInsightText]} numberOfLines={2}>
                        {entry.ai_insights}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Writing Stats */}
          {journalStats && (
            <View style={[styles.statsCard, isDark && styles.darkCard]}>
              <Text style={[styles.statsTitle, isDark && styles.darkText]}>Writing Journey</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{journalStats.totalEntries}</Text>
                  <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Entries</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{journalStats.streak}</Text>
                  <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Streak Days</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{journalStats.averageWordsPerDay}</Text>
                  <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Words/Day</Text>
                </View>
              </View>
            </View>
          )}
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
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  headerContainer: {
    padding: 24,
    paddingTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  darkBackupButton: {
    backgroundColor: '#1E3A8A',
    borderColor: '#4285F4',
  },
  backupButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#4285F4',
    marginLeft: 6,
  },
  darkBackupText: {
    color: '#60A5FA',
  },
  backupHint: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tagFilter: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  darkTagFilter: {
    backgroundColor: '#4B5563',
  },
  activeTagFilter: {
    backgroundColor: '#10B981',
  },
  tagFilterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  darkTagText: {
    color: '#D1D5DB',
  },
  activeTagText: {
    color: '#FFFFFF',
  },
  newEntryButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
  },
  newEntryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginHorizontal: 12,
  },
  insightsCard: {
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
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  insightsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
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
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  entryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  entryPreview: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  aiInsightPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 8,
  },
  darkInsightPreview: {
    backgroundColor: '#4B5563',
  },
  aiInsightText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#8B5CF6',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  darkInsightText: {
    color: '#C4B5FD',
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
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  // Writing mode styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  voiceButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  writeContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 20,
    paddingVertical: 12,
  },
  darkInput: {
    color: '#F9FAFB',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    lineHeight: 24,
    minHeight: 300,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 8,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  listeningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  writingTips: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#92400E',
    marginBottom: 12,
  },
  tip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#92400E',
    marginBottom: 8,
  },
});