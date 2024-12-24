-- Add phone_number column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR;

-- Update existing profiles with default values if needed
UPDATE profiles SET phone_number = '' WHERE phone_number IS NULL;
