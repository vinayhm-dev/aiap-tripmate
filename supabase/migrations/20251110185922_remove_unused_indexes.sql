/*
  # Remove Unused Indexes

  1. Cleanup
    - Remove unused indexes that are not being utilized
    - Reduces database overhead and storage
    - Improves write performance (fewer indexes to update)

  2. Indexes Removed
    - idx_share_links_slug (unused)
    - idx_testimonials_approved (unused)
    - idx_logs_event_name (unused)
    - idx_logs_user_id (unused)
    - idx_logs_created_at (unused)

  Note: These can be added back if usage patterns change
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_share_links_slug;
DROP INDEX IF EXISTS idx_testimonials_approved;
DROP INDEX IF EXISTS idx_logs_event_name;
DROP INDEX IF EXISTS idx_logs_user_id;
DROP INDEX IF EXISTS idx_logs_created_at;