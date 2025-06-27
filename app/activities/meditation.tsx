import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Play, Pause, RotateCcw, CircleCheck as CheckCircle, ArrowLeft, Volume2, VolumeX, Music } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { wellnessService } from '@/lib/database';

// Audio tracks for meditation with web-compatible URLs
const MEDITATION_TRACKS = [
  {
    id: 'nature_sounds',
    name: 'Forest Sounds',
    description: 'Gentle forest ambiance with birds and flowing water',
    icon: '🌲',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
  },
  {
    id: 'ocean_waves',
    name: 'Ocean Waves',
    description: 'Calming ocean waves for deep relaxation',
    icon: '🌊',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
  },
  {
    id: 'rain_sounds',
    name: 'Gentle Rain',
    description: 'Soft rainfall for peaceful meditation',
    icon: '🌧️',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
  },
  {
    id: 'singing_bowls',
    name: 'Tibetan Bowls',
    description: 'Traditional singing bowls for mindfulness',
    icon: '🎵',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'
  },
  {
    id: 'silence',
    name: 'Silent Session',
    description: 'Pure silence for focused meditation',
    icon: '🤫',
    url: null
  }
];

export default function MeditationScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [breathAnimation] = useState(new Animated.Value(1));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(300);
  const [selectedTrack, setSelectedTrack] = useState(MEDITATION_TRACKS[0]);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const durations = [
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            setIsCompleted(true);
            stopAudio();
            completeActivity();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  useEffect(() => {
    if (isPlaying) {
      startBreathingAnimation();
      if (soundEnabled && selectedTrack.url) {
        playAudio();
      }
    } else {
      stopAudio();
    }
  }, [isPlaying, soundEnabled, selectedTrack]);

  const startBreathingAnimation = () => {
    const breatheIn = () => {
      Animated.timing(breathAnimation, {
        toValue: 1.3,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        if (isPlaying) breatheOut();
      });
    };

    const breatheOut = () => {
      Animated.timing(breathAnimation, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        if (isPlaying) breatheIn();
      });
    };

    breatheIn();
  };

  const playAudio = async () => {
    if (Platform.OS === 'web' && selectedTrack.url && typeof window !== 'undefined') {
      try {
        // Stop any existing audio first
        stopAudio();
        
        const audioElement = new Audio();
        audioElement.loop = true;
        audioElement.volume = 0.3;
        audioElement.crossOrigin = 'anonymous';
        
        // Set up event handlers before setting src
        audioElement.oncanplaythrough = () => {
          audioElement.play().catch((error) => {
            console.warn('Audio autoplay blocked or failed:', error);
            // Audio will be silent if autoplay is blocked, which is fine for meditation
          });
        };
        
        audioElement.onerror = (error) => {
          console.warn('Audio failed to load, continuing with silent meditation:', error);
          // Continue with silent meditation if audio fails
        };
        
        audioElement.src = selectedTrack.url;
        audioElement.load();
        setAudio(audioElement);
      } catch (error) {
        console.warn('Audio setup failed, continuing with silent meditation:', error);
      }
    }
  };

  const stopAudio = () => {
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
      setAudio(null);
    }
  };

  const completeActivity = async () => {
    if (!user) return;
    
    try {
      await wellnessService.createActivity({
        user_id: user.id,
        activity_type: 'meditation',
        duration: Math.round((selectedDuration - timeRemaining) / 60),
        completed: true
      });
    } catch (error) {
      console.error('Error completing meditation:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetSession = () => {
    setIsPlaying(false);
    setTimeRemaining(selectedDuration);
    setIsCompleted(false);
    breathAnimation.setValue(1);
    stopAudio();
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const changeDuration = (duration: number) => {
    if (!isPlaying) {
      setSelectedDuration(duration);
      setTimeRemaining(duration);
    }
  };

  const selectTrack = (track: typeof MEDITATION_TRACKS[0]) => {
    if (!isPlaying) {
      setSelectedTrack(track);
      setShowTrackSelector(false);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled && isPlaying && selectedTrack.url) {
      // If enabling sound while playing, start audio
      playAudio();
    } else if (soundEnabled) {
      // If disabling sound, stop audio
      stopAudio();
    }
  };

  if (isCompleted) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <LinearGradient 
          colors={isDark ? ['#1F2937', '#111827'] : ['#FEE2E2', '#FFFFFF']} 
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Meditation Complete</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.completedContainer}
            showsVerticalScrollIndicator={false}
          >
            <CheckCircle size={80} color="#10B981" />
            <Text style={[styles.completedTitle, isDark && styles.darkText]}>Well Done! 🧘‍♀️</Text>
            <Text style={[styles.completedText, isDark && styles.darkSubtitle]}>
              You've completed your {Math.round(selectedDuration / 60)}-minute meditation session with {selectedTrack.name}. Your mind garden is growing stronger!
            </Text>
            
            <View style={[styles.benefitsCard, isDark && styles.darkCard]}>
              <Text style={[styles.benefitsTitle, isDark && styles.darkText]}>Benefits You Just Gained:</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Reduced stress and anxiety</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Improved focus and clarity</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Enhanced emotional regulation</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Better sleep quality</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Increased mindfulness</Text>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={() => router.back()}>
              <Text style={styles.continueButtonText}>Continue Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.againButton, isDark && styles.darkAgainButton]} onPress={resetSession}>
              <Text style={[styles.againButtonText, isDark && styles.darkAgainButtonText]}>Meditate Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient 
        colors={isDark ? ['#1F2937', '#111827'] : ['#FEE2E2', '#FFFFFF']} 
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Meditation</Text>
          <TouchableOpacity onPress={resetSession} style={styles.resetButton}>
            <RotateCcw size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Duration Selector */}
          {!isPlaying && (
            <View style={styles.durationSelector}>
              <Text style={[styles.durationTitle, isDark && styles.darkText]}>Choose Duration</Text>
              <View style={styles.durationButtons}>
                {durations.map((duration) => (
                  <TouchableOpacity
                    key={duration.value}
                    style={[
                      styles.durationButton,
                      isDark && styles.darkDurationButton,
                      selectedDuration === duration.value && styles.activeDurationButton
                    ]}
                    onPress={() => changeDuration(duration.value)}
                  >
                    <Text style={[
                      styles.durationButtonText,
                      isDark && styles.darkDurationText,
                      selectedDuration === duration.value && styles.activeDurationText
                    ]}>
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Audio Track Selector */}
          {!isPlaying && (
            <View style={styles.audioSelector}>
              <Text style={[styles.audioTitle, isDark && styles.darkText]}>Choose Your Soundscape</Text>
              <TouchableOpacity 
                style={[styles.selectedTrack, isDark && styles.darkSelectedTrack]}
                onPress={() => setShowTrackSelector(!showTrackSelector)}
              >
                <View style={styles.trackInfo}>
                  <Text style={styles.trackEmoji}>{selectedTrack.icon}</Text>
                  <View style={styles.trackDetails}>
                    <Text style={[styles.trackName, isDark && styles.darkText]}>{selectedTrack.name}</Text>
                    <Text style={[styles.trackDescription, isDark && styles.darkSubtitle]}>{selectedTrack.description}</Text>
                  </View>
                </View>
                <Music size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>

              {showTrackSelector && (
                <View style={[styles.trackList, isDark && styles.darkCard]}>
                  {MEDITATION_TRACKS.map((track) => (
                    <TouchableOpacity
                      key={track.id}
                      style={[
                        styles.trackOption,
                        selectedTrack.id === track.id && styles.activeTrackOption
                      ]}
                      onPress={() => selectTrack(track)}
                    >
                      <Text style={styles.trackEmoji}>{track.icon}</Text>
                      <View style={styles.trackDetails}>
                        <Text style={[styles.trackName, isDark && styles.darkText]}>{track.name}</Text>
                        <Text style={[styles.trackDescription, isDark && styles.darkSubtitle]}>{track.description}</Text>
                      </View>
                      {selectedTrack.id === track.id && (
                        <CheckCircle size={16} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <Animated.View 
              style={[
                styles.breathingCircle,
                isDark && styles.darkBreathingCircle,
                { transform: [{ scale: breathAnimation }] }
              ]}
            >
              <View style={[styles.innerCircle, isDark && styles.darkInnerCircle]}>
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                <Text style={styles.timerSubtext}>
                  {isPlaying ? (timeRemaining > selectedDuration / 2 ? 'Breathe In' : 'Breathe Out') : 'Ready'}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={[styles.instructionTitle, isDark && styles.darkText]}>
              {isPlaying ? 'Follow your breath' : 'Ready to begin?'}
            </Text>
            <Text style={[styles.instructionText, isDark && styles.darkSubtitle]}>
              {isPlaying 
                ? 'Inhale as the circle expands, exhale as it contracts. Let thoughts pass by like clouds in the sky.'
                : 'Find a comfortable position, close your eyes if you wish, and focus on your breathing.'
              }
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.soundButton, isDark && styles.darkSoundButton]}
              onPress={toggleSound}
            >
              {soundEnabled ? (
                <Volume2 size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              ) : (
                <VolumeX size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.playButton, isPlaying && styles.pauseButton]} 
              onPress={togglePlayPause}
            >
              {isPlaying ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>

          {/* Tips */}
          <View style={[styles.tipsContainer, isDark && styles.darkCard]}>
            <Text style={[styles.tipsTitle, isDark && styles.darkText]}>💡 Meditation Tips</Text>
            <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• It's normal for your mind to wander</Text>
            <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• Gently return focus to your breath</Text>
            <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• There's no "perfect" meditation</Text>
            <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• Consistency matters more than duration</Text>
            <Text style={[styles.tip, isDark && styles.darkSubtitle]}>• Be kind and patient with yourself</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEE2E2',
  },
  darkContainer: {
    backgroundColor: '#1F2937',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkSubtitle: {
    color: '#9CA3AF',
  },
  resetButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  durationSelector: {
    alignItems: 'center',
    marginBottom: 40,
  },
  durationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 20,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  durationButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  darkDurationButton: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  activeDurationButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  durationButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  darkDurationText: {
    color: '#D1D5DB',
  },
  activeDurationText: {
    color: '#FFFFFF',
  },
  audioSelector: {
    marginBottom: 40,
  },
  audioTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedTrack: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkSelectedTrack: {
    backgroundColor: '#374151',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  trackDetails: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
  },
  trackDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  trackList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  trackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeTrackOption: {
    backgroundColor: '#F0FDF4',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkBreathingCircle: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkInnerCircle: {
    backgroundColor: '#DC2626',
  },
  timerText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  timerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  instructionsContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  instructionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  soundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  darkSoundButton: {
    backgroundColor: '#374151',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tip: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  completedContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  completedTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  benefitItem: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  againButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  darkAgainButton: {
    borderColor: '#4B5563',
  },
  againButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  darkAgainButtonText: {
    color: '#9CA3AF',
  },
});