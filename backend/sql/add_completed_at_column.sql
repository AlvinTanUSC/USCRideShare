-- Migration: Add completed_at column to matches table
-- Date: 2025-12-05
-- Description: Adds completed_at timestamp field to track when a match is completed

ALTER TABLE matches
ADD COLUMN completed_at TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN matches.completed_at IS 'Timestamp when the match was marked as completed';
