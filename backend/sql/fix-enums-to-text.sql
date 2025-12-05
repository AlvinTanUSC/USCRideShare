-- Convert PostgreSQL enum columns back to TEXT for Hibernate compatibility
-- Run this in your Supabase SQL Editor

-- Step 1: Convert enum columns to TEXT
ALTER TABLE rides
  ALTER COLUMN status TYPE TEXT;

ALTER TABLE rides
  ALTER COLUMN cost_split_preference TYPE TEXT;

-- Step 2: Set default values as TEXT
ALTER TABLE rides
  ALTER COLUMN status SET DEFAULT 'ACTIVE';

ALTER TABLE rides
  ALTER COLUMN cost_split_preference SET DEFAULT 'EQUAL';

-- Step 3: Make status NOT NULL
ALTER TABLE rides
  ALTER COLUMN status SET NOT NULL;

-- Step 4: You can optionally drop the enum types if not used elsewhere
-- DROP TYPE IF EXISTS ride_status CASCADE;
-- DROP TYPE IF EXISTS cost_split_preference CASCADE;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rides' AND column_name IN ('status', 'cost_split_preference');
