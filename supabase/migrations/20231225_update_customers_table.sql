-- First, remove incorrect columns
ALTER TABLE customers 
DROP COLUMN IF EXISTS agent_greeting,
DROP COLUMN IF EXISTS agent_store_hours,
DROP COLUMN IF EXISTS agent_daily_specials;

-- Add relevant customer information columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20), -- 'phone', 'email', 'sms'
ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[], -- Array of dietary preferences
ADD COLUMN IF NOT EXISTS notes TEXT, -- For any special instructions or notes
ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Add call-related columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS call_recordings TEXT[], -- Array of URLs to call recordings
ADD COLUMN IF NOT EXISTS call_transcripts TEXT[], -- Array of call transcripts
ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMPTZ, -- Timestamp of most recent call
ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0, -- Total number of calls made
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id), -- Restaurant they called
ADD COLUMN IF NOT EXISTS average_call_duration INTEGER, -- Average call duration in seconds
ADD COLUMN IF NOT EXISTS last_order_details JSONB, -- Details of their last order
ADD COLUMN IF NOT EXISTS common_orders JSONB[]; -- Array of commonly ordered items

-- Create a function to handle customer call updates
CREATE OR REPLACE FUNCTION handle_customer_call()
RETURNS TRIGGER AS $$
BEGIN
    -- Update call statistics
    NEW.total_calls := COALESCE(OLD.total_calls, 0) + 1;
    NEW.last_call_at := CURRENT_TIMESTAMP;
    
    -- Update average call duration if provided
    IF NEW.average_call_duration IS NOT NULL THEN
        NEW.average_call_duration := (
            COALESCE(OLD.average_call_duration, 0) * COALESCE(OLD.total_calls, 0) + 
            NEW.average_call_duration
        ) / NEW.total_calls;
    END IF;

    -- Append new call recording and transcript if provided
    IF NEW.call_recordings IS NOT NULL THEN
        NEW.call_recordings := array_append(COALESCE(OLD.call_recordings, ARRAY[]::TEXT[]), NEW.call_recordings[1]);
    END IF;
    
    IF NEW.call_transcripts IS NOT NULL THEN
        NEW.call_transcripts := array_append(COALESCE(OLD.call_transcripts, ARRAY[]::TEXT[]), NEW.call_transcripts[1]);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS customer_call_trigger ON customers;

-- Create trigger for customer updates
CREATE TRIGGER customer_call_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW
    WHEN (NEW.call_recordings IS DISTINCT FROM OLD.call_recordings 
          OR NEW.call_transcripts IS DISTINCT FROM OLD.call_transcripts)
    EXECUTE FUNCTION handle_customer_call();

-- Add index for last_call_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_last_call_at') THEN
        CREATE INDEX idx_customers_last_call_at ON customers(last_call_at);
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurant staff can view their customers' call data" ON customers;
DROP POLICY IF EXISTS "Restaurant staff can update their customers' call data" ON customers;
DROP POLICY IF EXISTS "AI agent can create new customers" ON customers;

-- Add RLS policies for call-related data
CREATE POLICY "Restaurant staff can view their customers' call data"
ON customers
FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM restaurants WHERE id = customers.restaurant_id
));

CREATE POLICY "Restaurant staff can update their customers' call data"
ON customers
FOR UPDATE
USING (auth.uid() IN (
    SELECT user_id FROM restaurants WHERE id = customers.restaurant_id
))
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM restaurants WHERE id = customers.restaurant_id
));

-- Add policy for inserting new customers (when they call)
CREATE POLICY "AI agent can create new customers"
ON customers
FOR INSERT
WITH CHECK (true);

-- Function to get customer history and preferences
CREATE OR REPLACE FUNCTION get_customer_context(p_phone_number VARCHAR)
RETURNS JSONB AS $$
DECLARE
    customer_context JSONB;
BEGIN
    SELECT jsonb_build_object(
        'customer_info', jsonb_build_object(
            'name', first_name || ' ' || last_name,
            'phone', phone_number,
            'email', email,
            'dietary_preferences', dietary_preferences,
            'notes', notes
        ),
        'order_history', jsonb_build_object(
            'total_orders', total_orders,
            'total_spent', total_spent,
            'last_order', last_order_details,
            'common_orders', common_orders
        ),
        'call_history', jsonb_build_object(
            'total_calls', total_calls,
            'last_call', last_call_at,
            'average_duration', average_call_duration
        )
    ) INTO customer_context
    FROM customers
    WHERE phone_number = p_phone_number;

    RETURN COALESCE(customer_context, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE customers IS 'Stores customer information and order history metrics';
COMMENT ON COLUMN customers.first_name IS 'Customer''s first name';
COMMENT ON COLUMN customers.last_name IS 'Customer''s last name';
COMMENT ON COLUMN customers.email IS 'Customer''s email address';
COMMENT ON COLUMN customers.phone_number IS 'Customer''s phone number with country code';
COMMENT ON COLUMN customers.address IS 'Customer''s delivery address';
COMMENT ON COLUMN customers.preferred_contact_method IS 'Preferred method of contact (phone, email, sms)';
COMMENT ON COLUMN customers.dietary_preferences IS 'Array of dietary preferences or restrictions';
COMMENT ON COLUMN customers.notes IS 'Special instructions or notes about the customer';
COMMENT ON COLUMN customers.last_order_date IS 'Date of customer''s most recent order';
COMMENT ON COLUMN customers.total_orders IS 'Total number of orders placed by customer';
COMMENT ON COLUMN customers.total_spent IS 'Total amount spent by customer';
COMMENT ON COLUMN customers.loyalty_points IS 'Customer loyalty program points';
COMMENT ON COLUMN customers.call_recordings IS 'Array of URLs to call recordings';
COMMENT ON COLUMN customers.call_transcripts IS 'Array of call transcripts';
COMMENT ON COLUMN customers.last_call_at IS 'Timestamp of most recent call';
COMMENT ON COLUMN customers.total_calls IS 'Total number of calls made';
COMMENT ON COLUMN customers.restaurant_id IS 'Restaurant they called';
COMMENT ON COLUMN customers.average_call_duration IS 'Average call duration in seconds';
