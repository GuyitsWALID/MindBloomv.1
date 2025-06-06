import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Smile, Frown, Meh, Heart, Zap, Cloud } from 'lucide-react-native';

interface MoodSelectorProps {
  onMoodSelect: (mood: string) => void;
  selectedMood: string | null;
  isDark?: boolean;
}

export function MoodSelector({ onMoodSelect, selectedMood, isDark = false }: MoodSelectorProps) {
  const moods = [
    { id: 'happy', emoji: '😊', label: 'Happy', icon: Smile, color: '#10B981' },
    { id: 'calm', emoji: '😌', label: 'Calm', icon: Heart, color: '#3B82F6' },
    { id: 'neutral', emoji: '😐', label: 'Neutral', icon: Meh, color: '#6B7280' },
    { id: 'anxious', emoji: '😰', label: 'Anxious', icon: Cloud, color: '#F59E0B' },
    { id: 'sad', emoji: '😢', label: 'Sad', icon: Frown, color: '#EF4444' },
    { id: 'tired', emoji: '😴', label: 'Tired', icon: Zap, color: '#8B5CF6' },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.darkText]}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodButton,
              isDark && styles.darkMoodButton,
              selectedMood === mood.id && { 
                backgroundColor: mood.color + '20', 
                borderColor: mood.color 
              }
            ]}
            onPress={() => onMoodSelect(mood.id)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[
              styles.moodLabel, 
              isDark && styles.darkMoodLabel,
              selectedMood === mood.id && { color: mood.color }
            ]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 24,
    marginTop: 0,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 16,
  },
  darkText: {
    color: '#F9FAFB',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkMoodButton: {
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
    color: '#6B7280',
  },
  darkMoodLabel: {
    color: '#9CA3AF',
  },
});