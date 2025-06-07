/*
  # Enhanced Premium Subscription System

  1. New Tables
    - Enhanced `user_subscriptions` table with platform support
    - `subscription_features` table for feature management
    - `user_feature_access` table for granular feature control

  2. Security
    - Enhanced RLS policies for subscription management
    - Feature access control policies

  3. Functions
    - Function to check feature access
    - Function to grant trial access
*/

-- Add platform column to user_subscriptions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'platform'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN platform text DEFAULT 'web';
  END IF;
END $$;

-- Add revenuecat_user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions' AND column_name = 'revenuecat_user_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN revenuecat_user_id text;
  END IF;
END $$;

-- Create subscription_features table
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  plan_level text NOT NULL DEFAULT 'premium', -- 'free', 'premium', 'enterprise'
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for subscription_features
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read enabled features
CREATE POLICY "Anyone can read enabled subscription features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (enabled = true);

-- Create user_feature_access table for granular control
CREATE TABLE IF NOT EXISTS user_feature_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  granted boolean DEFAULT true,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  granted_by text DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for user_feature_access
ALTER TABLE user_feature_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own feature access
CREATE POLICY "Users can read own feature access"
  ON user_feature_access
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage feature access
CREATE POLICY "Service role can manage feature access"
  ON user_feature_access
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_feature_access_user_id_idx ON user_feature_access(user_id);
CREATE INDEX IF NOT EXISTS user_feature_access_feature_key_idx ON user_feature_access(feature_key);
CREATE INDEX IF NOT EXISTS user_subscriptions_platform_idx ON user_subscriptions(platform);

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION check_feature_access(user_id_param uuid, feature_key_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_subscription boolean := false;
  has_explicit_access boolean := false;
  subscription_active boolean := false;
BEGIN
  -- Check if user has an active subscription
  SELECT EXISTS(
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = user_id_param 
    AND status IN ('active', 'trial')
    AND current_period_end > now()
  ) INTO has_subscription;
  
  -- Check for explicit feature access
  SELECT EXISTS(
    SELECT 1 FROM user_feature_access 
    WHERE user_id = user_id_param 
    AND feature_key = feature_key_param
    AND granted = true
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO has_explicit_access;
  
  -- Return true if user has subscription or explicit access
  RETURN has_subscription OR has_explicit_access;
END;
$$;

-- Function to grant trial access to new users
CREATE OR REPLACE FUNCTION grant_trial_access(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Grant 7-day trial if user doesn't have any subscription
  IF NOT EXISTS(SELECT 1 FROM user_subscriptions WHERE user_id = user_id_param) THEN
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      trial_end,
      platform
    ) VALUES (
      user_id_param,
      'mindbloom_trial',
      'trial',
      now(),
      now() + interval '7 days',
      now() + interval '7 days',
      'web'
    );
  END IF;
END;
$$;

-- Insert default subscription features
INSERT INTO subscription_features (feature_key, name, description, category, plan_level) VALUES
  ('unlimited_ai', 'Unlimited AI Insights', 'Get unlimited personalized insights and coaching from our advanced AI', 'ai', 'premium'),
  ('advanced_analytics', 'Advanced Analytics', 'Deep insights into your wellness patterns with predictive analytics', 'analytics', 'premium'),
  ('custom_meditations', 'Custom Meditation Library', 'Access 200+ guided meditations and create personalized sessions', 'content', 'premium'),
  ('data_export', 'Export & Backup', 'Download your complete wellness data and create backups', 'export', 'premium'),
  ('premium_themes', 'Premium Themes', 'Unlock beautiful themes and complete customization options', 'customization', 'premium'),
  ('priority_support', 'Priority Support', '24/7 priority support with wellness experts', 'content', 'premium'),
  ('family_sharing', 'Family Sharing', 'Share premium features with up to 4 family members', 'content', 'premium'),
  ('content_library', 'Exclusive Content', 'Access premium courses, challenges, and expert content', 'content', 'premium'),
  ('habit_tracking', 'Advanced Habit Tracking', 'Track unlimited habits with smart reminders and insights', 'coaching', 'premium'),
  ('mood_prediction', 'Mood Prediction', 'AI-powered mood forecasting to prevent difficult days', 'ai', 'premium'),
  ('ai_coaching', 'AI Wellness Coach', 'Personal AI coach that adapts to your unique wellness journey', 'ai', 'premium'),
  ('pattern_recognition', 'Pattern Recognition', 'Advanced algorithms that identify your wellness patterns', 'analytics', 'premium')
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  plan_level = EXCLUDED.plan_level;

-- Create trigger to automatically grant trial access to new users
CREATE OR REPLACE FUNCTION auto_grant_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Grant trial access to new user after a short delay
  PERFORM grant_trial_access(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on users table (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_grant_trial_trigger'
  ) THEN
    CREATE TRIGGER auto_grant_trial_trigger
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION auto_grant_trial();
  END IF;
END $$;