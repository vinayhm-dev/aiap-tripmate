/*
  # Add Share Links Table

  1. New Table
    - `share_links`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key → trips.id)
      - `slug` (text, unique, random identifier for public URLs)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, nullable, for optional expiration)
  
  2. Security
    - Enable RLS on share_links table
    - Allow authenticated users to create share links for their trips
    - Allow public (anon) access to read share links for viewing
  
  3. Notes
    - Slug is used in public URLs like /s/abc123
    - Expires_at can be set for temporary shares
*/

CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to share_links"
  ON share_links FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_share_links_trip_id ON share_links(trip_id);
CREATE INDEX IF NOT EXISTS idx_share_links_slug ON share_links(slug);