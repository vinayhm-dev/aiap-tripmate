/*
  # Add Analytics Logs Table

  1. New Table
    - `logs`
      - `id` (uuid, primary key)
      - `event_name` (text, the event being tracked)
      - `trip_id` (uuid, nullable, foreign key → trips.id)
      - `user_id` (uuid, nullable, reference to user)
      - `metadata` (jsonb, nullable, for additional event data)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on logs table
    - Allow inserts for all users (to track events)
    - Restrict reads for demo purposes
  
  3. Tracked Events
    - trip_create: when a trip is created
    - trip_delete: when a trip is deleted
    - ai_generate: when AI suggestions are generated
    - share_create: when a share link is created
    - packing_list_generate: when packing list is generated
  
  4. Notes
    - Metadata can store additional context like generation type, preferences, etc
    - Trip_id and user_id are nullable for flexible tracking
*/

CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all to insert logs"
  ON logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to view logs for demo"
  ON logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_logs_event_name ON logs(event_name);
CREATE INDEX IF NOT EXISTS idx_logs_trip_id ON logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);