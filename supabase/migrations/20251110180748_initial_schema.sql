/*
  # Initial Schema Setup for Smart Trip Planner

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `created_at` (timestamptz)
    
    - `trips`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to users)
      - `title` (text)
      - `primary_destination` (text)
      - `trip_type` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `days`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key to trips)
      - `date` (date)
      - `day_index` (integer)
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `activities`
      - `id` (uuid, primary key)
      - `day_id` (uuid, foreign key to days)
      - `title` (text)
      - `start_time` (time)
      - `end_time` (time)
      - `duration_minutes` (integer)
      - `category` (text)
      - `notes` (text)
      - `position` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add basic policies for authenticated access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  primary_destination text NOT NULL,
  trip_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create days table
CREATE TABLE IF NOT EXISTS days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  day_index integer NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE days ENABLE ROW LEVEL SECURITY;

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid REFERENCES days(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_time time,
  end_time time,
  duration_minutes integer,
  category text,
  notes text,
  position integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (will be modified in next migration)
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view days of own trips"
  ON days FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert days to own trips"
  ON days FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update days of own trips"
  ON days FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete days of own trips"
  ON days FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view activities of own trips"
  ON activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert activities to own trips"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update activities of own trips"
  ON activities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete activities of own trips"
  ON activities FOR DELETE
  TO authenticated
  USING (true);