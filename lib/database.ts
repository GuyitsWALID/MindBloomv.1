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
  }
};