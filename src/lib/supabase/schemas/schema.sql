-- Create tables
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR NOT NULL,
    phone_number VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id),
    name VARCHAR NOT NULL,
    description TEXT,
    price NUMERIC(10, 2),
    ingredients TEXT[],
    image_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own restaurant"
    ON public.restaurants
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant"
    ON public.restaurants
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Restaurant owners can view their menu items"
    ON public.menu_items
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM restaurants 
            WHERE id = restaurant_id
        )
    );

CREATE POLICY "Restaurant owners can modify their menu items"
    ON public.menu_items
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM restaurants 
            WHERE id = restaurant_id
        )
    );
