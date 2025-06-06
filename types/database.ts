export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood: string;
  description?: string;
  ai_insight?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  ai_insights?: string;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  type: 'flower' | 'tree' | 'herb' | 'succulent';
  growth_stage: number;
  health: number;
  associated_activity: string;
  created_at: string;
  updated_at: string;
}

export interface WellnessActivity {
  id: string;
  user_id: string;
  activity_type: string;
  duration?: number;
  completed: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PremiumFeature {
  id: string;
  feature_key: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      mood_entries: {
        Row: MoodEntry;
        Insert: Omit<MoodEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<MoodEntry, 'id' | 'user_id' | 'created_at'>>;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>>;
      };
      plants: {
        Row: Plant;
        Insert: Omit<Plant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Plant, 'id' | 'user_id' | 'created_at'>>;
      };
      wellness_activities: {
        Row: WellnessActivity;
        Insert: Omit<WellnessActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<WellnessActivity, 'id' | 'user_id' | 'created_at'>>;
      };
      user_subscriptions: {
        Row: UserSubscription;
        Insert: Omit<UserSubscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserSubscription, 'id' | 'user_id' | 'created_at'>>;
      };
      premium_features: {
        Row: PremiumFeature;
        Insert: Omit<PremiumFeature, 'id' | 'created_at'>;
        Update: Partial<Omit<PremiumFeature, 'id' | 'created_at'>>;
      };
    };
  };
}