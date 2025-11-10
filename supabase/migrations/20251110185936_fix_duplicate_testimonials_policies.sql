/*
  # Fix Duplicate Testimonials Policies

  1. Issue
    - Multiple permissive policies for same action/role
    - Causes confusion and potential security issues
    - Need to consolidate into single policies

  2. Changes
    - Drop all existing testimonials policies
    - Create single clear policy for each action
    - Keep demo access simple and secure

  3. Security
    - Public can view approved testimonials only
    - Public can submit testimonials
    - Maintain RLS protection
*/

-- Drop all existing policies on testimonials
DROP POLICY IF EXISTS "Allow all access for demo" ON testimonials;
DROP POLICY IF EXISTS "Allow public to submit testimonials" ON testimonials;
DROP POLICY IF EXISTS "Allow public to view approved testimonials" ON testimonials;

-- Create single SELECT policy
CREATE POLICY "Public can view approved testimonials"
  ON testimonials FOR SELECT
  USING (approved = true);

-- Create single INSERT policy
CREATE POLICY "Public can submit testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (true);