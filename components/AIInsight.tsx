import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, Brain, ChevronDown, ChevronUp } from 'lucide-react-native';

interface AIInsightProps {
  insight: string;
  mood: string | null;
  followUpQuestions?: string[];
  isDark?: boolean;
}

export function AIInsight({ insight, mood, followUpQuestions = [], isDark = false }: AIInsightProps) {
  const [showQuestions, setShowQuestions] = useState(false);

  const getMoodColor = (moodType: string | null) => {
    switch (moodType) {
      case 'happy': return '#10B981';
      case 'calm': return '#3B82F6';
      case 'anxious': return '#F59E0B';
      case 'sad': return '#EF4444';
      case 'tired': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const moodColor = getMoodColor(mood);

  return (
    <View style={[styles.container, { borderLeftColor: moodColor }, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Brain size={20} color={moodColor} />
        <Text style={[styles.title, isDark && styles.darkText]}>AI Insight</Text>
        <Sparkles size={16} color={moodColor} />
      </View>
      <Text style={[styles.insight, isDark && styles.darkInsight]}>{insight}</Text>
      
      {followUpQuestions.length > 0 && (
        <View style={styles.questionsSection}>
          <TouchableOpacity 
            style={styles.questionsToggle}
            onPress={() => setShowQuestions(!showQuestions)}
          >
            <Text style={[styles.questionsToggleText, { color: moodColor }]}>
              Reflection Questions
            </Text>
            {showQuestions ? (
              <ChevronUp size={16} color={moodColor} />
            ) : (
              <ChevronDown size={16} color={moodColor} />
            )}
          </TouchableOpacity>
          
          {showQuestions && (
            <View style={styles.questionsList}>
              {followUpQuestions.map((question, index) => (
                <View key={index} style={styles.questionItem}>
                  <Text style={[styles.questionBullet, { color: moodColor }]}>•</Text>
                  <Text style={[styles.questionText, isDark && styles.darkQuestionText]}>
                    {question}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkContainer: {
    backgroundColor: '#374151',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  darkText: {
    color: '#F9FAFB',
  },
  insight: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  darkInsight: {
    color: '#D1D5DB',
  },
  questionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  questionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  questionsToggleText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  questionsList: {
    marginTop: 8,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionBullet: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginRight: 8,
    marginTop: 2,
  },
  questionText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },
  darkQuestionText: {
    color: '#9CA3AF',
  },
});