import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Heart, Sparkles, CircleCheck as CheckCircle, Lightbulb, Star } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { wellnessService, journalService } from '@/lib/database';

export default function GratitudeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [gratitudeItems, setGratitudeItems] = useState<string[]>(['']);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const addGratitudeItem = () => {
    if (gratitudeItems.length < 10) {
      setGratitudeItems([...gratitudeItems, '']);
    }
  };

  const updateGratitudeItem = (index: number, value: string) => {
    const newItems = [...gratitudeItems];
    newItems[index] = value;
    setGratitudeItems(newItems);
  };

  const removeGratitudeItem = (index: number) => {
    if (gratitudeItems.length > 1) {
      const newItems = gratitudeItems.filter((_, i) => i !== index);
      setGratitudeItems(newItems);
    }
  };

  const usePrompt = (prompt: string) => {
    const emptyIndex = gratitudeItems.findIndex(item => item.trim() === '');
    if (emptyIndex !== -1) {
      updateGratitudeItem(emptyIndex, prompt);
    } else {
      setGratitudeItems([...gratitudeItems, prompt]);
    }
    setSelectedPrompt(null);
  };

  const completeGratitudePractice = async () => {
    const filledItems = gratitudeItems.filter(item => item.trim().length > 0);
    
    if (filledItems.length === 0) {
      Alert.alert('Add Gratitude', 'Please add at least one thing you\'re grateful for.');
      return;
    }

    if (!user) return;

    try {
      // Enhanced gratitude content with reflection
      const gratitudeContent = filledItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
      
      const reflection = `
Today I practiced gratitude and reflected on ${filledItems.length} things that bring joy and meaning to my life:

${gratitudeContent}

This practice reminds me that even in challenging times, there are always reasons to be thankful. Gratitude helps me focus on abundance rather than scarcity, and strengthens my resilience and overall wellbeing.
      `;

      // Save as journal entry
      await journalService.createJournalEntry({
        user_id: user.id,
        title: `Gratitude Practice - ${new Date().toLocaleDateString()}`,
        content: reflection,
        tags: ['gratitude', 'reflection', 'positivity', 'mindfulness'],
        ai_insights: `Practicing gratitude regularly can improve mood by up to 25%, reduce stress hormones, and enhance overall life satisfaction. Your focus on ${filledItems.length} positive aspects shows a healthy mindset that will strengthen your mental resilience over time.`
      });

      // Save as wellness activity
      await wellnessService.createActivity({
        user_id: user.id,
        activity_type: 'gratitude',
        duration: 5,
        completed: true
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Error saving gratitude practice:', error);
      Alert.alert('Error', 'Failed to save your gratitude practice. Please try again.');
    }
  };

  const prompts = [
    "Someone who made you smile today",
    "A small moment that brought you joy",
    "Something in nature that you appreciate",
    "A skill or ability you possess",
    "A comfort or luxury you often take for granted",
    "A memory that makes you happy",
    "Something about your health or body",
    "A place that makes you feel peaceful",
    "An opportunity you've been given",
    "Something that made you laugh recently",
    "A book, movie, or song that moved you",
    "A challenge that helped you grow",
    "Someone who believes in you",
    "A tradition or ritual you enjoy",
    "Technology that makes your life easier"
  ];

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
            <Text style={[styles.headerTitle, isDark && styles.darkText]}>Gratitude Complete</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.completedContainer}>
            <Heart size={80} color="#EAB308" />
            <Text style={[styles.completedTitle, isDark && styles.darkText]}>Beautiful! 🙏</Text>
            <Text style={[styles.completedText, isDark && styles.darkSubtitle]}>
              You've completed your gratitude practice. Your positive reflections have been saved to your journal and will help nurture your mental garden.
            </Text>
            
            <View style={[styles.benefitsCard, isDark && styles.darkCard]}>
              <Text style={[styles.benefitsTitle, isDark && styles.darkText]}>Gratitude Benefits:</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Improved mood and happiness</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Reduced stress and anxiety</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Better sleep quality</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Stronger relationships</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Increased life satisfaction</Text>
              <Text style={[styles.benefitItem, isDark && styles.darkSubtitle]}>• Enhanced immune function</Text>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={() => router.back()}>
              <Text style={styles.continueButtonText}>Continue Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.againButton, isDark && styles.darkAgainButton]}
              onPress={() => {
                setGratitudeItems(['']);
                setIsCompleted(false);
              }}
            >
              <Text style={[styles.againButtonText, isDark && styles.darkAgainButtonText]}>Practice Again</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={isDark ? '#F9FAFB' : '#1F2937'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkText]}>Gratitude Practice</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introContainer}>
            <Text style={[styles.introTitle, isDark && styles.darkText]}>What are you grateful for today?</Text>
            <Text style={[styles.introText, isDark && styles.darkSubtitle]}>
              Take a moment to reflect on the positive aspects of your life. Research shows that practicing gratitude can significantly improve your mental well-being and overall life satisfaction.
            </Text>
          </View>

          <View style={styles.gratitudeContainer}>
            {gratitudeItems.map((item, index) => (
              <View key={index} style={[styles.gratitudeItem, isDark && styles.darkCard]}>
                <View style={styles.gratitudeNumber}>
                  <Text style={styles.gratitudeNumberText}>{index + 1}</Text>
                </View>
                <TextInput
                  style={[styles.gratitudeInput, isDark && styles.darkInput]}
                  placeholder="I'm grateful for..."
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  value={item}
                  onChangeText={(value) => updateGratitudeItem(index, value)}
                  multiline
                  numberOfLines={2}
                />
                {gratitudeItems.length > 1 && (
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeGratitudeItem(index)}
                  >
                    <Text style={[styles.removeButtonText, isDark && styles.darkRemoveText]}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {gratitudeItems.length < 10 && (
              <TouchableOpacity style={[styles.addButton, isDark && styles.darkAddButton]} onPress={addGratitudeItem}>
                <Plus size={20} color="#EAB308" />
                <Text style={styles.addButtonText}>Add another</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.promptsContainer, isDark && styles.darkCard]}>
            <View style={styles.promptsHeader}>
              <Lightbulb size={20} color="#EAB308" />
              <Text style={[styles.promptsTitle, isDark && styles.darkText]}>Need inspiration?</Text>
            </View>
            <Text style={[styles.promptsSubtitle, isDark && styles.darkSubtitle]}>Tap any prompt to add it to your list:</Text>
            <View style={styles.promptsGrid}>
              {prompts.slice(0, 6).map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.promptChip, isDark && styles.darkPromptChip]}
                  onPress={() => usePrompt(prompt)}
                >
                  <Star size={12} color="#EAB308" />
                  <Text style={[styles.promptText, isDark && styles.darkPromptText]}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.completeButton} onPress={completeGratitudePractice}>
            <Sparkles size={20} color="#FFFFFF" />
            <Text style={styles.completeButtonText}>Complete Practice</Text>
          </TouchableOpacity>

          <View style={[styles.tipContainer, isDark && styles.darkCard]}>
            <Text style={[styles.tipTitle, isDark && styles.darkText]}>🌟 Daily Tip</Text>
            <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
              Try to practice gratitude at the same time each day to build a positive habit. Many people find morning or bedtime works best. Consider keeping a gratitude journal for even greater benefits.
            </Text>
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
  introContainer: {
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  gratitudeContainer: {
    marginBottom: 32,
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  gratitudeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAB308',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gratitudeNumberText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  gratitudeInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  darkInput: {
    color: '#F9FAFB',
  },
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  darkRemoveText: {
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#EAB308',
    borderStyle: 'dashed',
  },
  darkAddButton: {
    backgroundColor: '#374151',
    borderColor: '#EAB308',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EAB308',
    marginLeft: 8,
  },
  promptsContainer: {
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
  promptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 8,
  },
  promptsSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 16,
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  darkPromptChip: {
    backgroundColor: '#4B5563',
  },
  promptText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#92400E',
    marginLeft: 4,
    flexShrink: 1,
  },
  darkPromptText: {
    color: '#FCD34D',
  },
  completeButton: {
    backgroundColor: '#EAB308',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  tipContainer: {
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
  tipTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
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
  },
  continueButton: {
    backgroundColor: '#EAB308',
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