-- First, check if restaurant_id column exists in orders
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'restaurant_id'
    ) THEN
        -- Add restaurant_id column if it doesn't exist
        ALTER TABLE orders 
        ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);

        -- Create an index for better query performance
        CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
    END IF;
END $$;
