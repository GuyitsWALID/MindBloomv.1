import { supabase } from './supabase';
import { Database } from '@/types/database';

type Tables = Database['public']['Tables'];

// User operations
export const userService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Tables['users']['Update']>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProfile(profile: Tables['users']['Insert']) {
    const { data, error } = await supabase
      .from('users')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Subscription operations
export const subscriptionService = {
  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  },

  async createSubscription(subscription: Tables['user_subscriptions']['Insert']) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert(subscription)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSubscription(id: string, updates: Tables['user_subscriptions']['Update']) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async cancelSubscription(id: string) {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPremiumFeatures() {
    const { data, error } = await supabase
      .from('premium_features')
      .select('*')
      .eq('enabled', true)
      .order('category');
    
    if (error) throw error;
    return data;
  }
};

// Mood entries operations
export const moodService = {
  async createMoodEntry(entry: Tables['mood_entries']['Insert']) {
    const { data, error } = await supabase
      .from('mood_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getMoodEntries(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getMoodEntriesForPeriod(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateMoodEntry(id: string, updates: Tables['mood_entries']['Update']) {
    const { data, error } = await supabase
      .from('mood_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMoodEntry(id: string) {
    const { error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Journal entries operations
export const journalService = {
  async createJournalEntry(entry: Tables['journal_entries']['Insert']) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getJournalEntries(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getJournalEntry(id: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateJournalEntry(id: string, updates: Tables['journal_entries']['Update']) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteJournalEntry(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getJournalStats(userId: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, created_at, content')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const totalEntries = data.length;
    const totalWords = data.reduce((sum, entry) => sum + entry.content.split(' ').length, 0);
    const averageWordsPerDay = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
    
    // Calculate streak
    const sortedEntries = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let streak = 0;
    let currentDate = new Date();
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.created_at);
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= streak + 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }
    
    return {
      totalEntries,
      averageWordsPerDay,
      streak
    };
  },

  async exportJournalData(userId: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};

// Plants operations
export const plantService = {
  async createPlant(plant: Tables['plants']['Insert']) {
    const { data, error } = await supabase
      .from('plants')
      .insert(plant)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPlants(userId: string) {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updatePlant(id: string, updates: Tables['plants']['Update']) {
    const { data, error } = await supabase
      .from('plants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePlant(id: string) {
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async waterPlant(id: string) {
    const { data: plant } = await supabase
      .from('plants')
      .select('health, growth_stage')
      .eq('id', id)
      .single();
    
    if (!plant) throw new Error('Plant not found');
    
    const newHealth = Math.min(100, plant.health + 10);
    const newGrowthStage = newHealth === 100 && plant.growth_stage < 5 
      ? plant.growth_stage + 1 
      : plant.growth_stage;
    
    const { data, error } = await supabase
      .from('plants')
      .update({ 
        health: newHealth, 
        growth_stage: newGrowthStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getGardenStats(userId: string) {
    const { data, error } = await supabase
      .from('plants')
      .select('health, growth_stage, created_at')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const totalPlants = data.length;
    const averageHealth = totalPlants > 0 
      ? Math.round(data.reduce((sum, plant) => sum + plant.health, 0) / totalPlants)
      : 0;
    
    const daysActive = totalPlants > 0 
      ? Math.floor((new Date().getTime() - new Date(Math.min(...data.map(p => new Date(p.created_at).getTime()))).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return {
      totalPlants,
      averageHealth,
      daysActive
    };
  }
};

// Wellness activities operations
export const wellnessService = {
  async createActivity(activity: Tables['wellness_activities']['Insert']) {
    const { data, error } = await supabase
      .from('wellness_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getActivities(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('wellness_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async getActivitiesForPeriod(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('wellness_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateActivity(id: string, updates: Tables['wellness_activities']['Update']) {
    const { data, error } = await supabase
      .from('wellness_activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async completeActivity(id: string) {
    const { data, error } = await supabase
      .from('wellness_activities')
      .update({ completed: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteActivity(id: string) {
    const { error } = await supabase
      .from('wellness_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getActivityStats(userId: string) {
    const { data, error } = await supabase
      .from('wellness_activities')
      .select('activity_type, completed, created_at')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const totalActivities = data.length;
    const completedActivities = data.filter(a => a.completed).length;
    const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
    
    // Group by activity type
    const activityCounts = data.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalActivities,
      completedActivities,
      completionRate,
      activityCounts
    };
  }
};

// Analytics operations
export const analyticsService = {
  async getDashboardData(userId: string) {
    const [moodEntries, journalStats, gardenStats, activityStats] = await Promise.all([
      moodService.getMoodEntries(userId, 7),
      journalService.getJournalStats(userId),
      plantService.getGardenStats(userId),
      wellnessService.getActivityStats(userId)
    ]);
    
    return {
      recentMoods: moodEntries,
      journalStats,
      gardenStats,
      activityStats
    };
  },

  async getWeeklyMoodData(userId: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const moodEntries = await moodService.getMoodEntriesForPeriod(
      userId,
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    // Process mood data for charts
    const moodValues: Record<string, number> = {
      'happy': 9,
      'calm': 8,
      'neutral': 6,
      'anxious': 4,
      'sad': 3,
      'tired': 5
    };
    
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('en', { weekday: 'short' });
      
      const dayEntries = moodEntries.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate.toDateString() === date.toDateString();
      });
      
      const averageMood = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + (moodValues[entry.mood] || 6), 0) / dayEntries.length
        : 6;
      
      dailyData.push({
        day: dayName,
        mood: Math.round(averageMood),
        energy: Math.round(averageMood * 0.8 + Math.random() * 2) // Simulated energy data
      });
    }
    
    return dailyData;
  },

  async getAdvancedAnalytics(userId: string) {
    // Premium feature - advanced analytics
    const [moodData, activities, journalEntries] = await Promise.all([
      moodService.getMoodEntriesForPeriod(userId, 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      ),
      wellnessService.getActivitiesForPeriod(userId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      ),
      journalService.getJournalEntries(userId, 30)
    ]);

    // Advanced pattern analysis
    const moodPatterns = analyzeMoodPatterns(moodData);
    const activityCorrelations = analyzeActivityCorrelations(activities, moodData);
    const journalInsights = analyzeJournalSentiment(journalEntries);

    return {
      moodPatterns,
      activityCorrelations,
      journalInsights,
      recommendations: generatePersonalizedRecommendations(moodData, activities, journalEntries)
    };
  }
};

// Helper functions for advanced analytics
function analyzeMoodPatterns(moodData: any[]) {
  // Analyze mood patterns by day of week, time trends, etc.
  const dayOfWeekPatterns = moodData.reduce((acc, entry) => {
    const day = new Date(entry.created_at).getDay();
    acc[day] = acc[day] || [];
    acc[day].push(entry.mood);
    return acc;
  }, {} as Record<number, string[]>);

  return {
    bestDays: Object.entries(dayOfWeekPatterns)
      .map(([day, moods]) => ({
        day: parseInt(day),
        averageMood: moods.length > 0 ? moods.reduce((sum, mood) => sum + getMoodValue(mood), 0) / moods.length : 0
      }))
      .sort((a, b) => b.averageMood - a.averageMood),
    trends: calculateMoodTrends(moodData)
  };
}

function analyzeActivityCorrelations(activities: any[], moodData: any[]) {
  // Analyze which activities correlate with better moods
  const correlations = activities.reduce((acc, activity) => {
    const activityDate = new Date(activity.created_at).toDateString();
    const sameDayMoods = moodData.filter(mood => 
      new Date(mood.created_at).toDateString() === activityDate
    );
    
    if (sameDayMoods.length > 0) {
      const avgMood = sameDayMoods.reduce((sum, mood) => sum + getMoodValue(mood.mood), 0) / sameDayMoods.length;
      acc[activity.activity_type] = acc[activity.activity_type] || [];
      acc[activity.activity_type].push(avgMood);
    }
    
    return acc;
  }, {} as Record<string, number[]>);

  return Object.entries(correlations).map(([activity, moods]) => ({
    activity,
    averageImpact: moods.reduce((sum, mood) => sum + mood, 0) / moods.length,
    frequency: moods.length
  })).sort((a, b) => b.averageImpact - a.averageImpact);
}

function analyzeJournalSentiment(journalEntries: any[]) {
  // Simple sentiment analysis based on keywords
  const positiveWords = ['happy', 'grateful', 'excited', 'joy', 'love', 'amazing', 'wonderful', 'great'];
  const negativeWords = ['sad', 'angry', 'frustrated', 'tired', 'stressed', 'worried', 'anxious'];

  return journalEntries.map(entry => {
    const content = entry.content.toLowerCase();
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    return {
      id: entry.id,
      date: entry.created_at,
      sentiment: positiveCount > negativeCount ? 'positive' : 
                 negativeCount > positiveCount ? 'negative' : 'neutral',
      score: positiveCount - negativeCount
    };
  });
}

function generatePersonalizedRecommendations(moodData: any[], activities: any[], journalEntries: any[]) {
  const recommendations = [];
  
  // Analyze recent mood trends
  const recentMoods = moodData.slice(0, 7);
  const avgRecentMood = recentMoods.reduce((sum, mood) => sum + getMoodValue(mood.mood), 0) / recentMoods.length;
  
  if (avgRecentMood < 6) {
    recommendations.push({
      type: 'mood_boost',
      title: 'Focus on Mood Boosting Activities',
      description: 'Your recent mood scores suggest you could benefit from more uplifting activities.',
      actions: ['Try a 10-minute gratitude practice', 'Schedule a nature walk', 'Connect with a friend']
    });
  }
  
  // Analyze activity patterns
  const activityCounts = activities.reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if ((activityCounts.meditation || 0) < 3) {
    recommendations.push({
      type: 'meditation',
      title: 'Increase Meditation Practice',
      description: 'Regular meditation can significantly improve mood and reduce stress.',
      actions: ['Start with 5-minute daily sessions', 'Try guided meditations', 'Set a consistent time']
    });
  }
  
  return recommendations;
}

function getMoodValue(mood: string): number {
  const moodValues: Record<string, number> = {
    'happy': 9,
    'calm': 8,
    'neutral': 6,
    'anxious': 4,
    'sad': 3,
    'tired': 5
  };
  return moodValues[mood] || 6;
}

function calculateMoodTrends(moodData: any[]) {
  if (moodData.length < 2) return { direction: 'stable', change: 0 };
  
  const recent = moodData.slice(0, Math.ceil(moodData.length / 2));
  const older = moodData.slice(Math.ceil(moodData.length / 2));
  
  const recentAvg = recent.reduce((sum, mood) => sum + getMoodValue(mood.mood), 0) / recent.length;
  const olderAvg = older.reduce((sum, mood) => sum + getMoodValue(mood.mood), 0) / older.length;
  
  const change = recentAvg - olderAvg;
  
  return {
    direction: change > 0.5 ? 'improving' : change < -0.5 ? 'declining' : 'stable',
    change: Math.round(change * 10) / 10
  };
}