-- First, check and add restaurant_id to agents table if needed
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'agents' 
        AND column_name = 'restaurant_id'
    ) THEN
        ALTER TABLE agents 
        ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);

        CREATE INDEX idx_agents_restaurant_id ON agents(restaurant_id);
    END IF;

    -- Check and add restaurant_id to orders table if needed
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'restaurant_id'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);

        CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
    END IF;
END $$;
