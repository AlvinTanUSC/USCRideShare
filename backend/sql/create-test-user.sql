-- Create a test user for development
-- Run this in your Supabase SQL Editor

-- Insert a test user with a known UUID
INSERT INTO users (user_id, email, first_name, last_name, phone_number, profile_picture_url, email_verified, created_at)
VALUES (
  'a0a0a0a0-1111-2222-3333-444444444444'::uuid,  -- Use this UUID in your X-User-Id header
  'test@usc.edu',
  'Test',
  'User',
  '+1234567890',
  NULL,
  true,
  NOW(),
);

-- Verify the user was created
SELECT user_id, email, first_name, last_name, phone_number, email_verified, created_at
FROM users
WHERE email = 'test@usc.edu';
