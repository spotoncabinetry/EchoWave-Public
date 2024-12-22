-- Orders table schema
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    customer_phone VARCHAR NOT NULL,
    customer_name VARCHAR,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    items JSONB NOT NULL, -- Array of menu items with quantities and special instructions
    total_amount NUMERIC(10, 2) NOT NULL,
    special_instructions TEXT,
    order_type VARCHAR NOT NULL CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')),
    payment_status VARCHAR NOT NULL CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS orders_profile_id_idx ON public.orders(profile_id);
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_order_timestamp ON orders;
CREATE TRIGGER update_order_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_updated_at();
