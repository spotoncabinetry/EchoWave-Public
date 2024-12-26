-- Add enhanced call tracking columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS preferred_call_times TIMESTAMPTZ[], -- Array of times when customer typically calls
ADD COLUMN IF NOT EXISTS call_sentiment_history JSONB[], -- Track sentiment analysis of each call
ADD COLUMN IF NOT EXISTS common_inquiries TEXT[], -- Store frequent questions/requests
ADD COLUMN IF NOT EXISTS callback_preferences JSONB DEFAULT '{"preferred_time": null, "do_not_call": false}'::JSONB, -- Callback preferences
ADD COLUMN IF NOT EXISTS last_interaction_summary TEXT, -- Summary of last interaction
ADD COLUMN IF NOT EXISTS call_tags TEXT[], -- Tags for categorizing calls (e.g., 'reservation', 'complaint', 'inquiry')
ADD COLUMN IF NOT EXISTS peak_calling_hours INTEGER[], -- Hours when customer typically calls (0-23)
ADD COLUMN IF NOT EXISTS call_success_rate FLOAT DEFAULT 1.0, -- Ratio of successful calls (not dropped/failed)
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10), -- Language preference based on calls
ADD COLUMN IF NOT EXISTS voice_characteristics JSONB; -- Store voice characteristics for better identification

-- Create a type for call outcomes
DO $$ BEGIN
    CREATE TYPE call_outcome AS ENUM ('completed', 'dropped', 'busy', 'no_answer', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing objects if they exist
DO $$ 
BEGIN
    -- Drop triggers first
    DROP TRIGGER IF EXISTS update_customer_prefs_trigger ON customer_call_logs;
    DROP TRIGGER IF EXISTS update_call_logs_updated_at ON customer_call_logs;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS update_call_logs_updated_at() CASCADE;
    DROP FUNCTION IF EXISTS analyze_customer_call_patterns(VARCHAR) CASCADE;
    DROP FUNCTION IF EXISTS update_customer_preferences() CASCADE;
    
    -- Drop table last (will cascade to dependent objects)
    DROP TABLE IF EXISTS customer_call_logs CASCADE;
EXCEPTION
    WHEN undefined_table THEN 
        NULL;
    WHEN undefined_function THEN 
        NULL;
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create the main table first
CREATE TABLE customer_call_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES restaurants(id),
    customer_id UUID REFERENCES customers(id),
    agent_id UUID REFERENCES agents(id),
    transcript TEXT,
    outcome VARCHAR(50),
    interaction_summary TEXT,
    call_tags TEXT[],
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes after table exists
CREATE INDEX idx_customer_call_logs_restaurant_id 
    ON customer_call_logs(restaurant_id);
    
CREATE INDEX idx_customer_call_logs_customer_id 
    ON customer_call_logs(customer_id);
    
CREATE INDEX idx_customer_call_logs_created_at 
    ON customer_call_logs(created_at);
    
CREATE INDEX idx_customer_call_logs_outcome 
    ON customer_call_logs(outcome);

-- Create trigger function
CREATE FUNCTION update_call_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_call_logs_updated_at
    BEFORE UPDATE ON customer_call_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_call_logs_updated_at();

-- Add RLS policies
ALTER TABLE customer_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own restaurant's call logs"
ON customer_call_logs
FOR SELECT
USING (restaurant_id IN (
    SELECT id FROM restaurants
    WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert call logs for their restaurant"
ON customer_call_logs
FOR INSERT
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants
    WHERE user_id = auth.uid()
));

-- Function to analyze call patterns
CREATE FUNCTION analyze_customer_call_patterns(customer_phone VARCHAR)
RETURNS TABLE (
    total_calls INTEGER,
    avg_duration NUMERIC,
    preferred_day INTEGER,
    preferred_hour INTEGER,
    common_topics TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(cl.id)::INTEGER as total_calls,
        AVG(cl.duration_seconds)::NUMERIC as avg_duration,
        MODE() WITHIN GROUP (ORDER BY EXTRACT(DOW FROM cl.created_at))::INTEGER as preferred_day,
        MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM cl.created_at))::INTEGER as preferred_hour,
        ARRAY_AGG(DISTINCT unnest(cl.call_tags)) as common_topics
    FROM customer_call_logs cl
    JOIN customers c ON cl.customer_id = c.id
    WHERE c.phone = customer_phone
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer preferences based on call history
CREATE OR REPLACE FUNCTION update_customer_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Update peak calling hours
    WITH call_hours AS (
        SELECT EXTRACT(HOUR FROM created_at)::INTEGER as hour
        FROM customer_call_logs
        WHERE customer_id = NEW.customer_id
        ORDER BY created_at DESC
        LIMIT 10
    )
    SELECT array_agg(DISTINCT hour)
    INTO NEW.peak_calling_hours
    FROM call_hours;

    -- Update call success rate
    WITH call_outcomes AS (
        SELECT 
            COUNT(*) FILTER (WHERE outcome = 'completed') as successful,
            COUNT(*) as total
        FROM customer_call_logs
        WHERE customer_id = NEW.customer_id
    )
    SELECT COALESCE(successful::float / NULLIF(total, 0), 1.0)
    INTO NEW.call_success_rate
    FROM call_outcomes;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating customer preferences
CREATE TRIGGER update_customer_prefs_trigger
    AFTER INSERT OR UPDATE ON customer_call_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_preferences();

-- Add indexes for call logs
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_customer_id ON customer_call_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_restaurant_id ON customer_call_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_created_at ON customer_call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_call_logs_outcome ON customer_call_logs(outcome);

-- Add RLS policies for call logs
ALTER TABLE customer_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant staff can view their call logs"
ON customer_call_logs
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM restaurants WHERE id = customer_call_logs.restaurant_id
));

CREATE POLICY "AI can insert call logs"
ON customer_call_logs
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE customer_call_logs IS 'Detailed logs of customer calls including AI interaction details';
