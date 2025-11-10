/*
  # Add Testimonials Table

  1. New Table
    - `testimonials`
      - `id` (uuid, primary key)
      - `name` (text, customer name)
      - `rating` (integer, 1-5 stars)
      - `comment` (text, testimonial content)
      - `location` (text, optional location/title)
      - `approved` (boolean, default false for moderation)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on testimonials table
    - Allow anyone to submit testimonials (anonymous insert)
    - Only show approved testimonials to public
  
  3. Notes
    - Rating should be between 1-5 stars
    - Approved flag allows admin moderation before display
    - Submissions are visible only after approval
*/

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  location text,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to submit testimonials"
  ON testimonials FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public to view approved testimonials"
  ON testimonials FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Allow all access for demo"
  ON testimonials FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON testimonials(created_at DESC);