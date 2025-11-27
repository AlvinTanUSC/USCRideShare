-- Fix enum case mismatch - convert lowercase enums to uppercase
-- Run this in your Supabase SQL Editor

-- Step 1: First, convert columns back to text temporarily
ALTER TABLE rides
  ALTER COLUMN status TYPE text;

ALTER TABLE rides
  ALTER COLUMN cost_split_preference TYPE text;

-- Step 2: Drop the old lowercase enums
DROP TYPE IF EXISTS ride_status CASCADE;
DROP TYPE IF EXISTS cost_split_preference CASCADE;

-- Step 3: Create new enums with UPPERCASE values to match Java
CREATE TYPE ride_status AS ENUM ('ACTIVE', 'MATCHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE cost_split_preference AS ENUM ('EQUAL', 'BY_DISTANCE');

-- Step 4: Update any existing data to uppercase (if there's data)
UPDATE rides SET status = UPPER(status) WHERE status IS NOT NULL;
UPDATE rides SET cost_split_preference = UPPER(cost_split_preference) WHERE cost_split_preference IS NOT NULL;

-- Step 5: Convert columns to use the new enum types
ALTER TABLE rides
  ALTER COLUMN status TYPE ride_status USING status::ride_status;

ALTER TABLE rides
  ALTER COLUMN cost_split_preference TYPE cost_split_preference USING cost_split_preference::cost_split_preference;

-- Step 6: Set default values
ALTER TABLE rides
  ALTER COLUMN status SET DEFAULT 'ACTIVE'::ride_status;

ALTER TABLE rides
  ALTER COLUMN cost_split_preference SET DEFAULT 'EQUAL'::cost_split_preference;

-- Step 7: Make status NOT NULL
ALTER TABLE rides
  ALTER COLUMN status SET NOT NULL;
