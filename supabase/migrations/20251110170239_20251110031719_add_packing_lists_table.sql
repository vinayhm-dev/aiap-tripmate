/*
  # Add Packing Lists Table

  1. New Table
    - `packing_lists`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key → trips.id)
      - `content` (jsonb, stores categorized items)
      - `generated_by` (text, either 'ai' or 'manual')
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on packing_lists table
    - Allow all access for demo purposes
  
  3. Notes
    - Content JSONB structure: { "clothing": [...], "electronics": [...], "toiletries": [...], etc }
*/

CREATE TABLE IF NOT EXISTS packing_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}',
  generated_by text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to packing_lists"
  ON packing_lists FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_packing_lists_trip_id ON packing_lists(trip_id);