/*
  # Add Missing Foreign Key Indexes

  1. Performance Optimization
    - Add index on activities(day_id) for foreign key lookup
    - Add index on activity_ratings(user_id) for foreign key lookup
    - Add index on days(trip_id) for foreign key lookup
    - Add index on trips(owner_id) for foreign key lookup

  2. Benefits
    - Improves JOIN performance
    - Speeds up CASCADE operations
    - Optimizes foreign key constraint checks
    - Better query performance for related data lookups
*/

-- Add index for activities.day_id foreign key
CREATE INDEX IF NOT EXISTS idx_activities_day_id ON activities(day_id);

-- Add index for activity_ratings.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_activity_ratings_user_id ON activity_ratings(user_id);

-- Add index for days.trip_id foreign key
CREATE INDEX IF NOT EXISTS idx_days_trip_id ON days(trip_id);

-- Add index for trips.owner_id foreign key
CREATE INDEX IF NOT EXISTS idx_trips_owner_id ON trips(owner_id);