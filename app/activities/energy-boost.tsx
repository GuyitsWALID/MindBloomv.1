import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Play, Pause, SkipForward, CircleCheck as CheckCircle, ArrowLeft, Zap, Timer } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { wellnessService } from '@/lib/database';

interface Exercise {
  name: string;
  duration: number;
  description: string;
  instructions: string[];
  intensity: 'low' | 'medium' | 'high';
}

const exercises: Exercise[] = [
  {
    name: 'Jumping Jacks',
    duration: 30,
    description: 'Get your heart pumping with classic jumping jacks',
    instructions: [
      'Stand with feet together, arms at sides',
      'Jump while spreading legs shoulder-width apart',
      'Simultaneously raise arms overhead',
      'Jump back to starting position',
      'Maintain steady rhythm'
    ],
    intensity: 'medium'
  },
  {
    name: 'High Knees',
    duration: 30,
    description: 'Boost energy with high knee marching',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Lift right knee toward chest',
      'Quickly switch to lift left knee',
      'Pump arms naturally as you march',
      'Keep core engaged throughout'
    ],
    intensity: 'medium'
  },
  {
    name: 'Arm Circles',
    duration: 20,
    description: 'Energize your upper body with arm circles',
    instructions: [
      'Extend arms out to sides at shoulder height',
      'Make small circles forward for 10 seconds',
      'Reverse direction for remaining time',
      'Keep shoulders relaxed',
      'Gradually increase circle size'
    ],
    intensity: 'low'
  },
  {
    name: 'Body Shakes',
    duration: 20,
    description: 'Release tension and boost circulation',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Start shaking your hands and arms',
      'Add in leg shaking and bouncing',
      'Let your whole body shake loosely',
      'Breathe deeply throughout'
    ],
    intensity: 'low'
  },
  {
    name: 'Mountain Climbers',
    duration: 25,
    description: 'Full-body energizer for maximum impact',
    instructions: [
      'Start in plank position',
      'Bring right knee toward chest',
      'Quickly switch legs',
      'Keep hips level and core tight',
      'Maintain quick, controlled movements'
    ],
    intensity: 'high'
  }
];

export default function EnergyBoostScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [currentExercise, setCurrentExercise] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(exercises[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (isResting) {
              setIsResting(false);
              nextExercise();
            } else {
              startRest();
            }
            return 0;
          }
          return prev - 1;
        });
        setTotalTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, isResting]);

  useEffect(() => {
    if (isActive && !isResting) {
      startPulseAnimation();
    }
  }, [isActive, isResting]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRest = () => {
    if (currentExercise < exercises.length - 1) {
      setIsResting(true);
      setRestTime(10); // 10 second rest
      setTimeRemaining(10);
    } else {
      completeWorkout();
    }
  };

  const nextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      const nextIndex = currentExercise + 1;
      setCurrentExercise(nextIndex);
      setTimeRemaining(exercises[nextIndex].duration);
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    setIsActive(false);
    setIsCompleted(true);
    pulseAnimation.stopAnimation();
    
    if (!user) return;
    
    try {
      await wellnessService.createActivity({
        user_id: user.id,
        activity_type: 'exercise',
        duration: Math.round(totalTime / 60),
        completed: true
      });
    } catch (error) {
      console.error('Error completing energy boost:', error);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const skipExercise = () => {
    if (isResting) {
      setIsResting(false);
      nextExercise();
    } else {
      startRest();
    }
  };

  const resetWorkout = () => {
    setCurrentExercise(0);
    setTimeRemaining(exercises[0].duration);
    setIsActive(false);
    setIsCompleted(false);
    setTotalTime(0);
    setIsResting(false);
    pulseAnimation.setValue(1);
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (isCompleted) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <LinearGradient 
          colors={isDark ? ['#1F2937', '#111827'] : ['#FEF3C7', '#FFFFFF']} 
          style={styles.gradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Energy Boost Complete</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.completedContainer}>
            <Zap size={80} color="#F59E0B" />
            <Text style={[styles.completedTitle, isDark && styles.darkText]}>Energized! ⚡</Text>
            <Text style={[styles.completedText, isDark && styles.darkSubtitle]}>
              Great job! You've completed your energy boost routine. Feel that natural energy flowing through your body!
            </Text>
            
            <View style={[styles.statsCard, isDark && styles.darkCard]}>
              <Text style={[styles.statsTitle, isDark && styles.darkText]}>Your Session:</Text>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Total Time:</Text>
                <Text style={[styles.statValue, isDark && styles.darkText]}>{Math.round(totalTime / 60)} minutes</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Exercises:</Text>
                <Text style={[styles.statValue, isDark && styles.darkText]}>{exercises.length} completed</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Energy Level:</Text>
                <Text style={[styles.statValue, isDark && styles.darkText]}>Boosted! 🚀</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Calories Burned:</Text>
                <Text style={[styles.statValue, isDark && styles.darkText]}>~{Math.round(totalTime * 0.15)} cal</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={() => router.back()}>
              <Text style={styles.continueButtonText}>Continue Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.againButton, isDark && styles.darkAgainButton]} onPress={resetWorkout}>
              <Text style={[styles.againButtonText, isDark && styles.darkAgainButtonText]}>Do Another Round</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const currentEx = exercises[currentExercise];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient 
        colors={isDark ? ['#1F2937', '#111827'] : ['#FEF3C7', '#FFFFFF']} 
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Energy Boost</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, isDark && styles.darkSubtitle]}>
              Exercise {currentExercise + 1} of {exercises.length}
            </Text>
            <View style={[styles.progressBar, isDark && styles.darkProgressBar]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentExercise + 1) / exercises.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.timerContainer}>
            <Animated.View 
              style={[
                styles.timerCircle,
                isDark && styles.darkTimerCircle,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <Text style={styles.timerText}>{timeRemaining}</Text>
              <Text style={styles.timerLabel}>seconds</Text>
              {isResting && <Text style={styles.restLabel}>Rest</Text>}
            </Animated.View>
          </View>

          <View style={styles.exerciseContainer}>
            <View style={styles.exerciseHeader}>
              <Text style={[styles.exerciseName, isDark && styles.darkText]}>
                {isResting ? 'Rest Time' : currentEx.name}
              </Text>
              <View style={[
                styles.intensityBadge,
                { backgroundColor: getIntensityColor(currentEx.intensity) + '20' }
              ]}>
                <Text style={[
                  styles.intensityText,
                  { color: getIntensityColor(currentEx.intensity) }
                ]}>
                  {currentEx.intensity.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.exerciseDescription, isDark && styles.darkSubtitle]}>
              {isResting ? 'Take a breather and prepare for the next exercise' : currentEx.description}
            </Text>
          </View>

          {!isResting && (
            <View style={[styles.instructionsContainer, isDark && styles.darkCard]}>
              <Text style={[styles.instructionsTitle, isDark && styles.darkText]}>How to do it:</Text>
              {currentEx.instructions.map((instruction, index) => (
                <Text key={index} style={[styles.instruction, isDark && styles.darkSubtitle]}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.skipButton, isDark && styles.darkSkipButton]} 
              onPress={skipExercise}
            >
              <SkipForward size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text style={[styles.skipButtonText, isDark && styles.darkSkipText]}>
                {isResting ? 'Skip Rest' : 'Skip'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.playButton, isActive && styles.pauseButton]} 
              onPress={toggleTimer}
            >
              {isActive ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>

          <View style={[styles.motivationContainer, isDark && styles.darkCard]}>
            <Text style={[styles.motivationTitle, isDark && styles.darkText]}>💪 Stay Motivated</Text>
            <Text style={[styles.motivationText, isDark && styles.darkSubtitle]}>
              Even a few minutes of movement can significantly boost your energy levels and improve your mood. You're doing great!
            </Text>
            <View style={styles.benefitsList}>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Increases endorphins</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Improves circulation</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Boosts mental clarity</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  darkProgressBar: {
    backgroundColor: '#4B5563',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  darkTimerCircle: {
    backgroundColor: '#D97706',
  },
  timerText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  restLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  exerciseContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginRight: 12,
  },
  intensityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  intensityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  exerciseDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  instructionsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    padding: 12,
  },
  darkSkipButton: {
    backgroundColor: '#4B5563',
    borderRadius: 12,
  },
  skipButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 4,
  },
  darkSkipText: {
    color: '#D1D5DB',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    backgroundColor: '#EF4444',
  },
  motivationContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  motivationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  motivationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  continueButton: {
    backgroundColor: '#F59E0B',
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