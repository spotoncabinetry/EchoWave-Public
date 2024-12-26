-- Add test-related columns to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS menu_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS voice_recording_url TEXT,
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS ai_response TEXT,
ADD COLUMN IF NOT EXISTS test_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS test_success BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS test_error_message TEXT;

-- Update agents table to include testing and configuration fields
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS menu_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS transcription jsonb DEFAULT '{"enabled": true, "language": "en-AU"}',
ADD COLUMN IF NOT EXISTS ai_response jsonb DEFAULT '{"enabled": true, "voice": "alloy", "language": "en-AU"}',
ADD COLUMN IF NOT EXISTS test_error_message text,
ADD COLUMN IF NOT EXISTS test_duration_seconds integer,
ADD COLUMN IF NOT EXISTS last_test_at timestamp with time zone;

-- Add RLS policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own restaurant's agents"
ON agents
FOR SELECT
USING (restaurant_id IN (
    SELECT id FROM restaurants
    WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert agents for their restaurant"
ON agents
FOR INSERT
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants
    WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own restaurant's agents"
ON agents
FOR UPDATE
USING (restaurant_id IN (
    SELECT id FROM restaurants
    WHERE user_id = auth.uid()
));
