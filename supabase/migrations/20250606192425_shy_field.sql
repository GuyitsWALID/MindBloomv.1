/*
  # Create subscription tables for Mindbloom Premium

  1. New Tables
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `plan_id` (text, subscription plan identifier)
      - `status` (text, subscription status)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `trial_end` (timestamptz, optional)
      - `stripe_subscription_id` (text, optional)
      - `stripe_customer_id` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_subscriptions` table
    - Add policies for users to read/update their own subscriptions
    - Add policy for service role to manage subscriptions

  3. Indexes
    - Add index on user_id for fast lookups
    - Add index on status for filtering active subscriptions
    - Add index on stripe_subscription_id for webhook processing
*/

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial', 'past_due');

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  status subscription_status NOT NULL DEFAULT 'trial',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  trial_end timestamptz,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_subscription_id_idx ON user_subscriptions(stripe_subscription_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample premium features data (optional)
CREATE TABLE IF NOT EXISTS premium_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for premium_features
ALTER TABLE premium_features ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read premium features
CREATE POLICY "Anyone can read premium features"
  ON premium_features
  FOR SELECT
  TO authenticated
  USING (enabled = true);

-- Insert default premium features
INSERT INTO premium_features (feature_key, name, description, category) VALUES
  ('unlimited_ai', 'Unlimited AI Insights', 'Get personalized insights and recommendations without limits', 'ai'),
  ('advanced_analytics', 'Advanced Analytics', 'Deep dive into your wellness patterns with detailed charts and trends', 'analytics'),
  ('custom_meditations', 'Custom Meditation Sessions', 'Create personalized meditation experiences tailored to your needs', 'content'),
  ('data_export', 'Export Your Data', 'Download your journal entries, mood data, and progress reports', 'export'),
  ('premium_themes', 'Premium Themes', 'Access exclusive color schemes and customization options', 'customization'),
  ('priority_support', 'Priority Support', 'Get faster response times and dedicated customer support', 'content'),
  ('family_sharing', 'Family Sharing', 'Share your premium subscription with up to 4 family members', 'content'),
  ('content_library', 'Exclusive Content', 'Access premium guided meditations, courses, and wellness programs', 'content')
ON CONFLICT (feature_key) DO NOTHING;