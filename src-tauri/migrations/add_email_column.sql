-- Manual fix for adding email column to users table
-- Run this script directly in MySQL if migrations fail

-- Add email column if it doesn't exist
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- Note: If you get an error that the column already exists, that's fine - it means it's already there
