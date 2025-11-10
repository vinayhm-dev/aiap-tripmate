/*
  # Optimize RLS Policies with Auth Functions

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Changes
    - Update activity_ratings policies to use subquery pattern
    - Ensures auth function is called once per query, not per row
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create ratings" ON activity_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON activity_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON activity_ratings;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Authenticated users can create ratings"
  ON activity_ratings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own ratings"
  ON activity_ratings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own ratings"
  ON activity_ratings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);