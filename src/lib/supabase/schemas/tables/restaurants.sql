-- Restaurants table schema
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    address VARCHAR,
    phone_number VARCHAR,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS restaurants_owner_id_idx ON public.restaurants(owner_id);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_restaurant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_restaurant_timestamp ON restaurants;
CREATE TRIGGER update_restaurant_timestamp
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_restaurant_updated_at();
