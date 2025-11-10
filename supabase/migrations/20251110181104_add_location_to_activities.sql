/*
  # Add location field to activities table

  1. Changes
    - Add `location` column to `activities` table to store place names/addresses
    - Add `location_lat` and `location_lon` columns for coordinates
    - These fields help track where activities take place and enable location-based suggestions

  2. Notes
    - Location fields are optional (NULL allowed)
    - Coordinates enable distance calculations for nearby suggestions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'location'
  ) THEN
    ALTER TABLE activities ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE activities ADD COLUMN location_lat decimal(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities' AND column_name = 'location_lon'
  ) THEN
    ALTER TABLE activities ADD COLUMN location_lon decimal(11, 8);
  END IF;
END $$;