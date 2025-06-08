import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Flower, Droplets, Sun, Leaf, Sparkles, Award, TrendingUp } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { plantService, wellnessService } from '@/lib/database';
import { Plant } from '@/types/database';

export default function GardenScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [gardenStats, setGardenStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [animatedValues] = useState(() => 
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );

  useEffect(() => {
    if (user) {
      loadGardenData();
    }
  }, [user]);

  useEffect(() => {
    // Animate plants when they load
    if (plants.length > 0) {
      const animations = plants.map((_, index) => 
        Animated.spring(animatedValues[index], {
          toValue: 1,
          delay: index * 100,
          useNativeDriver: true,
        })
      );
      Animated.stagger(100, animations).start();
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

      // Create a wellness activity for the new plant
      await wellnessService.createActivity({
        user_id: user.id,
        activity_type: randomActivity.toLowerCase().replace(' ', '_'),
        completed: false
      });

      Alert.alert(
        'New Seed Planted! 🌱',
        `${randomName} has been planted in your wellness garden. This plant represents your commitment to ${randomActivity}. Nurture it through consistent practice and watch your mental well-being flourish!`,
        [{ text: 'Begin Growing!', style: 'default' }]
      );

      loadGardenData();
    } catch (error) {
      console.error('Error creating plant:', error);
      Alert.alert('Error', 'Failed to plant new seed. Please try again.');
    }
  };

  const waterPlant = async (plantId: string) => {
    try {
      const updatedPlant = await plantService.waterPlant(plantId);
      
      // Animate the plant growth
      const plantIndex = plants.findIndex(p => p.id === plantId);
      if (plantIndex !== -1) {
        Animated.sequence([
          Animated.spring(animatedValues[plantIndex], {
            toValue: 1.2,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValues[plantIndex], {
            toValue: 1,
            useNativeDriver: true,
          })
        ]).start();
      }
      
      Alert.alert(
        'Plant Nurtured! 💧',
        `Your ${updatedPlant.name} feels the positive energy from your wellness activities! Health: ${updatedPlant.health}%, Growth Stage: ${updatedPlant.growth_stage}/5. Each drop of care strengthens your mental resilience.`,
        [{ text: 'Keep Growing!', style: 'default' }]
      );

      loadGardenData();
    } catch (error) {
      console.error('Error watering plant:', error);
      Alert.alert('Error', 'Failed to water plant. Please try again.');
    }
  };

  const handleSunlightPlant = async (plantId: string) => {
    try {
      const updatedPlant = await plantService.sunlightPlant(plantId);
      
      // Animate the plant growth
      const plantIndex = plants.findIndex(p => p.id === plantId);
      if (plantIndex !== -1) {
        Animated.sequence([
          Animated.spring(animatedValues[plantIndex], {
            toValue: 1.3,
            useNativeDriver: true,
          }),
          Animated.spring(animatedValues[plantIndex], {
            toValue: 1,
            useNativeDriver: true,
          })
        ]).start();
      }
      
      Alert.alert(
        'Sunlight Shared! ☀️',
        `Your ${updatedPlant.name} basks in the warm glow of your consistent journaling! Health: ${updatedPlant.health}%, Growth Stage: ${updatedPlant.growth_stage}/5. Your reflective practice illuminates the path to inner growth.`,
        [{ text: 'Continue Reflecting!', style: 'default' }]
      );

      loadGardenData();
    } catch (error) {
      console.error('Error giving sunlight to plant:', error);
      Alert.alert('Error', 'Failed to give sunlight to plant. Please try again.');
    }
  };

  const getPlantEmoji = (plant: Plant) => {
    const stageEmojis = {
      flower: ['🌱', '🌿', '🌸', '🌺', '🌻'],
      tree: ['🌱', '🌿', '🌳', '🌲', '🌳'],
      herb: ['🌱', '🌿', '🌾', '🍃', '🌿'],
      succulent: ['🌱', '🌵', '🌵', '🌵', '🌵']
    };
    return stageEmojis[plant.type][plant.growth_stage - 1];
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#10B981';
    if (health >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getDaysOld = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const achievements = [
    { title: 'Seed Planter', description: 'Planted your first seed of intention', earned: plants.length > 0, icon: '🌱' },
    { title: 'Garden Tender', description: 'Nurtured 3 aspects of wellness for a week', earned: plants.length >= 3, icon: '🌿' },
    { title: 'Bloom Cultivator', description: 'Witnessed the full flowering of growth', earned: plants.some(p => p.type === 'flower' && p.growth_stage === 5), icon: '🌸' },
    { title: 'Ecosystem Builder', description: 'Created a diverse wellness ecosystem', earned: plants.length >= 5, icon: '🌳' },
    { title: 'Harmony Keeper', description: 'Achieved perfect balance in all areas', earned: plants.length > 0 && plants.every(p => p.health === 100), icon: '🧘‍♀️' },
    { title: 'Master Gardener', description: 'Reached full maturity in personal growth', earned: plants.some(p => p.growth_stage === 5), icon: '🏆' },
  ];

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
        colors={isDark ? ['#1F2937', '#111827'] : ['#ECFDF5', '#FFFFFF']} 
        style={styles.gradient}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.greeting, isDark && styles.darkText]}>Your Wellness Garden 🌻</Text>
            <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>Where inner growth takes root and flourishes</Text>
          </View>

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
              <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Your Growing Intentions</Text>
              <TouchableOpacity style={styles.addPlantButton} onPress={createNewPlant}>
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.addPlantText}>Plant New Seed</Text>
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
              <View style={styles.plantsGrid}>
                {plants.map((plant, index) => (
                  <Animated.View
                    key={plant.id}
                    style={[
                      {
                        transform: [{ scale: animatedValues[index] }],
                        opacity: animatedValues[index],
                      }
                    ]}
                  >
                    <TouchableOpacity 
                      style={[
                        styles.plantCard,
                        isDark && styles.darkCard,
                        selectedPlant === plant.id && styles.selectedPlantCard
                      ]}
                      onPress={() => setSelectedPlant(selectedPlant === plant.id ? null : plant.id)}
                    >
                      <View style={styles.plantEmoji}>
                        <Text style={styles.plantEmojiText}>{getPlantEmoji(plant)}</Text>
                      </View>
                      <Text style={[styles.plantName, isDark && styles.darkText]}>{plant.name}</Text>
                      <Text style={[styles.plantActivity, isDark && styles.darkSubtitle]}>
                        {plant.associated_activity}
                      </Text>
                      
                      <View style={styles.healthBar}>
                        <View 
                          style={[
                            styles.healthFill, 
                            { 
                              width: `${plant.health}%`,
                              backgroundColor: getHealthColor(plant.health)
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.healthText, isDark && styles.darkSubtitle]}>
                        {plant.health}% vitality
                      </Text>

                      <View style={styles.plantMeta}>
                        <Text style={[styles.plantAge, isDark && styles.darkSubtitle]}>
                          {getDaysOld(plant.created_at)} days growing
                        </Text>
                        <Text style={styles.growthStage}>Stage {plant.growth_stage}/5</Text>
                      </View>

                      {/* Plant Actions */}
                      {selectedPlant === plant.id && (
                        <View style={styles.plantActions}>
                          <TouchableOpacity 
                            style={[styles.actionButton, isDark && styles.darkActionButton]}
                            onPress={() => waterPlant(plant.id)}
                          >
                            <Droplets size={16} color="#3B82F6" />
                            <Text style={[styles.actionText, isDark && styles.darkActionText]}>Water</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, isDark && styles.darkActionButton]}
                            onPress={() => handleSunlightPlant(plant.id)}
                          >
                            <Sun size={16} color="#F59E0B" />
                            <Text style={[styles.actionText, isDark && styles.darkActionText]}>Sunlight</Text>
                          </TouchableOpacity>
                          
                          <Text style={[styles.actionHint, isDark && styles.darkActionHint]}>
                            💧 Water: Complete wellness activities • ☀️ Sunlight: Consistent journaling
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Growth Milestones</Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.achievementCard,
                    isDark && styles.darkCard,
                    achievement.earned && styles.earnedAchievement
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Award 
                    size={20} 
                    color={achievement.earned ? '#F59E0B' : (isDark ? '#6B7280' : '#9CA3AF')} 
                  />
                  <Text style={[
                    styles.achievementTitle,
                    isDark && styles.darkText,
                    achievement.earned && styles.earnedText
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    isDark && styles.darkSubtitle,
                    achievement.earned && styles.earnedDescription
                  ]}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Care Tips */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Wisdom for Growth</Text>
            <View style={[styles.tipsCard, isDark && styles.darkCard]}>
              <View style={styles.tipItem}>
                <Droplets size={20} color="#3B82F6" />
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, isDark && styles.darkText]}>Nourishing Waters</Text>
                  <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
                    Complete wellness activities to water your plants. Each meditation, exercise, or mindful practice sends life-giving energy to your garden, representing how consistent self-care nourishes your mental health.
                  </Text>
                </View>
              </View>
              <View style={styles.tipItem}>
                <Sun size={20} color="#F59E0B" />
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, isDark && styles.darkText]}>Illuminating Sunlight</Text>
                  <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
                    Regular journaling provides sunlight for growth. Your written reflections illuminate patterns, insights, and wisdom, helping your inner garden flourish through the power of self-awareness and mindful observation.
                  </Text>
                </View>
              </View>
              <View style={styles.tipItem}>
                <TrendingUp size={20} color="#10B981" />
                <View style={styles.tipContent}>
                  <Text style={[styles.tipTitle, isDark && styles.darkText]}>Steady Growth</Text>
                  <Text style={[styles.tipText, isDark && styles.darkSubtitle]}>
                    Like real plants, your wellness garden thrives on consistency rather than intensity. Small, daily acts of self-care create lasting transformation, building resilience and inner strength that grows stronger with time.
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
  overviewCard: {
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
  darkCard: {
    backgroundColor: '#374151',
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
  },
  section: {
    margin: 24,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  addPlantButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addPlantText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 6,
  },
  emptyGarden: {
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
  emptyGardenText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyGardenSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  plantCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedPlantCard: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  plantEmoji: {
    alignItems: 'center',
    marginBottom: 12,
  },
  plantEmojiText: {
    fontSize: 32,
  },
  plantName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  plantActivity: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  healthBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
  },
  healthFill: {
    height: '100%',
    borderRadius: 3,
  },
  healthText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  plantMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plantAge: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  growthStage: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  plantActions: {
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
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  darkActionButton: {
    backgroundColor: '#4B5563',
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#4B5563',
    marginLeft: 4,
  },
  darkActionText: {
    color: '#D1D5DB',
  },
  actionHint: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },
  darkActionHint: {
    color: '#6B7280',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  earnedAchievement: {
    backgroundColor: '#FEF3C7',
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  earnedText: {
    color: '#92400E',
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#D1D5DB',
    textAlign: 'center',
  },
  earnedDescription: {
    color: '#92400E',
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
});