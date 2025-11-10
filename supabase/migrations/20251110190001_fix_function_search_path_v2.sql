/*
  # Fix Function Search Path (v2)

  1. Security Issue
    - Function has mutable search_path which is a security risk
    - Can allow malicious schemas to intercept function calls
    - Need to set explicit immutable search_path

  2. Changes
    - Drop trigger first, then function
    - Recreate update_activity_rating function with SECURITY DEFINER
    - Set explicit search_path to prevent schema injection
    - Recreate trigger

  3. Security
    - Function now uses explicit schema references
    - Protected from search_path manipulation attacks
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_activity_rating ON activity_ratings;

-- Drop function
DROP FUNCTION IF EXISTS update_activity_rating();

-- Recreate with secure search_path
CREATE OR REPLACE FUNCTION public.update_activity_rating()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.activities
  SET 
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM public.activity_ratings
      WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.activity_ratings
      WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
    )
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_update_activity_rating
  AFTER INSERT OR UPDATE OR DELETE ON activity_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_rating();