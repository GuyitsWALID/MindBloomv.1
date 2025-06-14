import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Flower, Droplets, Sun, Leaf, Sparkles, Award, TrendingUp, Plus, Calendar, Target } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { plantService, wellnessService, moodService, journalService } from '@/lib/database';
import { Plant } from '@/types/database';
import { AnimatedPlant } from '@/components/AnimatedPlant';

const { width: screenWidth } = Dimensions.get('window');

export default function GardenScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [gardenStats, setGardenStats] = useState<any>(null);
  const [dailyProgress, setDailyProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animatedValues] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );

  useEffect(() => {
    if (user) {
      loadGardenData();
      loadDailyProgress();
    }
  }, [user]);

  useEffect(() => {
    // Animate plants when they load
    if (plants.length > 0) {
      const animations = plants.map((_, index) => 
        Animated.spring(animatedValues[index], {
          toValue: 1,
          delay: index * 200,
          useNativeDriver: true,
        })
      );
      Animated.stagger(200, animations).start();
    }
  }, [plants]);

  const loadGardenData = async () => {
    if (!user) return;
    
    try {
      const [plantsData, statsData] = await Promise.all([
        plantService.getPlants(user.id),
        plantService.getGardenStats(user.id)
      ]);
      
      setPlants(plantsData);
      setGardenStats(statsData);
    } catch (error) {
      console.error('Error loading garden data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyProgress = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const [moodEntries, journalEntries, activities] = await Promise.all([
        moodService.getMoodEntriesForPeriod(user.id, today + 'T00:00:00Z', today + 'T23:59:59Z'),
        journalService.getJournalEntries(user.id, 1),
        wellnessService.getActivitiesForPeriod(user.id, today + 'T00:00:00Z', today + 'T23:59:59Z')
      ]);

      const todayJournal = journalEntries.filter(entry => 
        new Date(entry.created_at).toDateString() === new Date().toDateString()
      );

      const completedActivities = activities.filter(a => a.completed).length;
      const totalPossibleActivities = 5; // mood, journal, meditation, exercise, gratitude

      const progress = {
        mood: moodEntries.length > 0,
        journal: todayJournal.length > 0,
        activities: completedActivities,
        totalActivities: totalPossibleActivities,
        overallProgress: Math.round(((moodEntries.length > 0 ? 1 : 0) + 
                                   (todayJournal.length > 0 ? 1 : 0) + 
                                   completedActivities) / (2 + totalPossibleActivities) * 100)
      };

      setDailyProgress(progress);
    } catch (error) {
      console.error('Error loading daily progress:', error);
    }
  };

  const createNewPlant = async () => {
    if (!user) return;

    try {
      const plantTypes = ['flower', 'tree', 'herb', 'succulent'] as const;
      const plantNames = {
        flower: ['Mindfulness Bloom', 'Serenity Blossom', 'Joy Petal', 'Peace Flower', 'Gratitude Rose'],
        tree: ['Wisdom Oak', 'Strength Pine', 'Growth Maple', 'Resilience Birch', 'Calm Willow'],
        herb: ['Focus Rosemary', 'Energy Mint', 'Balance Sage', 'Clarity Basil', 'Harmony Thyme'],
        succulent: ['Patience Aloe', 'Endurance Jade', 'Stability Stone', 'Persistence Cactus', 'Zen Echeveria']
      };
      
      const activities = [
        'Daily Meditation', 'Gratitude Journal', 'Breathing Exercises', 
        'Self-Compassion', 'Mindful Walking', 'Positive Affirmations',
        'Energy Boost', 'Reflection Practice'
      ];
      
      const randomType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
      const randomName = plantNames[randomType][Math.floor(Math.random() * plantNames[randomType].length)];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];

      await plantService.createPlant({
        user_id: user.id,
        name: randomName,
        type: randomType,
        growth_stage: 1,
        health: 100,
        associated_activity: randomActivity
      });

      Alert.alert(
        'New Seed Planted! 🌱',
        `${randomName} has been planted in your wellness garden. This plant represents your commitment to ${randomActivity}. Nurture it through consistent practice and watch your mental well-being flourish!`,
        [{ text: 'Begin Growing!', style: 'default' }]
      );

      loadGardenData();
      loadDailyProgress();
    } catch (error) {
      console.error('Error creating plant:', error);
      Alert.alert('Error', 'Failed to plant new seed. Please try again.');
    }
  };

  const waterPlant = async (plantId: string) => {
    try {
      const updatedPlant = await plantService.waterPlant(plantId);
      
      Alert.alert(
        'Plant Nurtured! 💧',
        `Your ${updatedPlant.name} feels the positive energy from your wellness activities! Health: ${updatedPlant.health}%, Growth Stage: ${updatedPlant.growth_stage}/5.`,
        [{ text: 'Keep Growing!', style: 'default' }]
      );

      loadGardenData();
    } catch (error) {
      console.error('Error watering plant:', error);
      Alert.alert('Error', 'Failed to water plant. Please try again.');
    }
  };

  const calculatePlantGrowth = (plant: Plant) => {
    // Calculate growth based on health and daily progress
    const baseGrowth = (plant.health / 100) * (plant.growth_stage / 5) * 100;
    const progressBonus = dailyProgress ? (dailyProgress.overallProgress / 100) * 20 : 0;
    return Math.min(100, baseGrowth + progressBonus);
  };

  const getDaysOld = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Loading your wellness garden...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <LinearGradient 
        colors={isDark ? ['#1F2937', '#111827'] : ['#ECFDF5', '#F0FDF4']} 
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.greeting, isDark && styles.darkText]}>Your Wellness Garden 🌻</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>Where inner growth takes root and flourishes</Text>
          </View>

          {/* Daily Progress Card */}
          {dailyProgress && (
            <View style={[styles.progressCard, isDark && styles.darkCard]}>
              <View style={styles.progressHeader}>
                <Calendar size={20} color="#10B981" />
                <Text style={[styles.progressTitle, isDark && styles.darkText]}>Today's Growth</Text>
                <Text style={[styles.progressPercentage, { color: '#10B981' }]}>
                  {dailyProgress.overallProgress}%
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${dailyProgress.overallProgress}%` }
                  ]} 
                />
              </View>
              
              <View style={styles.progressItems}>
                <View style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: dailyProgress.mood ? '#10B981' : '#E5E7EB' }]} />
                  <Text style={[styles.progressItemText, isDark && styles.darkSubtitle]}>Mood Check</Text>
                </View>
                <View style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: dailyProgress.journal ? '#10B981' : '#E5E7EB' }]} />
                  <Text style={[styles.progressItemText, isDark && styles.darkSubtitle]}>Journal Entry</Text>
                </View>
                <View style={styles.progressItem}>
                  <View style={[styles.progressDot, { backgroundColor: dailyProgress.activities > 0 ? '#10B981' : '#E5E7EB' }]} />
                  <Text style={[styles.progressItemText, isDark && styles.darkSubtitle]}>
                    Activities ({dailyProgress.activities}/{dailyProgress.totalActivities})
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Garden Overview */}
          <View style={[styles.overviewCard, isDark && styles.darkCard]}>
            <View style={styles.overviewHeader}>
              <Leaf size={24} color="#10B981" />
              <Text style={[styles.overviewTitle, isDark && styles.darkText]}>Garden Vitality</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{gardenStats?.averageHealth || 0}%</Text>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Wellness Health</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{gardenStats?.totalPlants || 0}</Text>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Growth Areas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{gardenStats?.daysActive || 0}</Text>
                <Text style={[styles.statLabel, isDark && styles.darkSubtitle]}>Days Nurturing</Text>
              </View>
            </View>
          </View>

          {/* Garden Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Your Growing Garden</Text>
              <TouchableOpacity style={styles.addPlantButton} onPress={createNewPlant}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addPlantText}>Plant Seed</Text>
              </TouchableOpacity>
            </View>
            
            {plants.length === 0 ? (
              <View style={[styles.emptyGarden, isDark && styles.darkCard]}>
                <Text style={[styles.emptyGardenText, isDark && styles.darkText]}>Your wellness garden awaits</Text>
                <Text style={[styles.emptyGardenSubtext, isDark && styles.darkSubtitle]}>
                  Plant your first seed of intention and begin cultivating the garden of your mind. Each plant represents a commitment to your mental well-being and personal growth.
                </Text>
              </View>
            ) : (
              <View style={styles.gardenGrid}>
                {plants.map((plant, index) => (
                  <Animated.View
                    key={plant.id}
                    style={[
                      styles.plantSpot,
                      {
                        transform: [
                          { scale: animatedValues[index] },
                          { 
                            translateY: animatedValues[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            })
                          }
                        ],
                        opacity: animatedValues[index],
                      }
                    ]}
                  >
                    <TouchableOpacity 
                      style={[
                        styles.plantContainer,
                        isDark && styles.darkPlantContainer,
                        selectedPlant === plant.id && styles.selectedPlantContainer
                      ]}
                      onPress={() => setSelectedPlant(selectedPlant === plant.id ? null : plant.id)}
                    >
                      <View style={styles.plantDisplay}>
                        <AnimatedPlant
                          growthStage={calculatePlantGrowth(plant)}
                          plantType={plant.type}
                          size={100}
                          isDark={isDark}
                        />
                      </View>
                      
                      <View style={styles.plantInfo}>
                        <Text style={[styles.plantName, isDark && styles.darkText]}>{plant.name}</Text>
                        <Text style={[styles.plantActivity, isDark && styles.darkSubtitle]}>
                          {plant.associated_activity}
                        </Text>
                        
                        <View style={styles.plantMeta}>
                          <View style={styles.healthContainer}>
                            <View style={styles.healthBar}>
                              <View 
                                style={[
                                  styles.healthFill, 
                                  { 
                                    width: `${plant.health}%`,
                                    backgroundColor: plant.health >= 80 ? '#10B981' : plant.health >= 60 ? '#F59E0B' : '#EF4444'
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={[styles.healthText, isDark && styles.darkSubtitle]}>
                              {plant.health}% vitality
                            </Text>
                          </View>
                          
                          <View style={styles.plantStats}>
                            <Text style={[styles.plantAge, isDark && styles.darkSubtitle]}>
                              {getDaysOld(plant.created_at)} days old
                            </Text>
                            <Text style={[styles.growthStage, { backgroundColor: '#10B981' + '20', color: '#10B981' }]}>
                              Stage {plant.growth_stage}/5
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Plant Actions */}
                      {selectedPlant === plant.id && (
                        <View style={styles.plantActions}>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.waterButton]}
                            onPress={() => waterPlant(plant.id)}
                          >
                            <Droplets size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Water</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.sunlightButton]}
                            onPress={() => waterPlant(plant.id)}
                          >
                            <Sun size={18} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Sunlight</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* Growth Tips */}
          <View style={[styles.tipsCard, isDark && styles.darkCard]}>
            <View style={styles.tipsHeader}>
              <Target size={20} color="#10B981" />
              <Text style={[styles.tipsTitle, isDark && styles.darkText]}>Growing Tips</Text>
            </View>
            <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
              🌱 Complete daily wellness activities to help your plants grow
            </Text>
            <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
              💧 Regular mood tracking and journaling provides essential nutrients
            </Text>
            <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
              ☀️ Consistency is key - small daily actions create the biggest growth
            </Text>
            <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
              🌸 Watch your plants bloom as you build lasting wellness habits
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
    backgroundColor: '#ECFDF5',
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  darkCard: {
    backgroundColor: '#374151',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
    marginLeft: 12,
  },
  progressPercentage: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  progressItemText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    margin: 24,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  addPlantButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addPlantText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  emptyGarden: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyGardenText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyGardenSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  gardenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantSpot: {
    width: '48%',
    marginBottom: 20,
  },
  plantContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkPlantContainer: {
    backgroundColor: '#374151',
  },
  selectedPlantContainer: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  plantDisplay: {
    alignItems: 'center',
    marginBottom: 12,
    height: 120,
    justifyContent: 'center',
  },
  plantInfo: {
    alignItems: 'center',
  },
  plantName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  plantActivity: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  plantMeta: {
    width: '100%',
  },
  healthContainer: {
    marginBottom: 8,
  },
  healthBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
  },
  healthFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  plantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantAge: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  growthStage: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  plantActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 0.48,
  },
  waterButton: {
    backgroundColor: '#3B82F6',
  },
  sunlightButton: {
    backgroundColor: '#F59E0B',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
});