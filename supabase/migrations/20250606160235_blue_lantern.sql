/*
  # Initial Mindbloom Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text, optional)
      - `avatar_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `mood` (text, mood type)
      - `description` (text, optional user description)
      - `ai_insight` (text, optional AI-generated insight)
      - `created_at` (timestamp)
    
    - `journal_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `content` (text)
      - `tags` (text array)
      - `ai_insights` (text, optional AI analysis)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `plants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `type` (text, plant type enum)
      - `growth_stage` (integer, 1-5)
      - `health` (integer, 0-100)
      - `associated_activity` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `wellness_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `activity_type` (text)
      - `duration` (integer, optional duration in minutes)
      - `completed` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own records
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mood text NOT NULL,
  description text,
  ai_insight text,
  created_at timestamptz DEFAULT now()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  ai_insights text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create plants table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('flower', 'tree', 'herb', 'succulent')),
  growth_stage integer NOT NULL DEFAULT 1 CHECK (growth_stage >= 1 AND growth_stage <= 5),
  health integer NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  associated_activity text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wellness_activities table
CREATE TABLE IF NOT EXISTS wellness_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  duration integer,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for mood_entries table
CREATE POLICY "Users can read own mood entries"
  ON mood_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for journal_entries table
CREATE POLICY "Users can read own journal entries"
  ON journal_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for plants table
CREATE POLICY "Users can read own plants"
  ON plants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plants"
  ON plants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
  ON plants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
  ON plants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for wellness_activities table
CREATE POLICY "Users can read own wellness activities"
  ON wellness_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness activities"
  ON wellness_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness activities"
  ON wellness_activities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness activities"
  ON wellness_activities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS mood_entries_user_id_idx ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS mood_entries_created_at_idx ON mood_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS journal_entries_user_id_idx ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS journal_entries_created_at_idx ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS plants_user_id_idx ON plants(user_id);
CREATE INDEX IF NOT EXISTS wellness_activities_user_id_idx ON wellness_activities(user_id);
CREATE INDEX IF NOT EXISTS wellness_activities_created_at_idx ON wellness_activities(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();