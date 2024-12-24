-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.menu_item_notes CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;
DROP TABLE IF EXISTS public.menu_uploads CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables in correct order (dependencies first)
-- Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    restaurant_id UUID REFERENCES public.restaurants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu Categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu Items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    category_id UUID REFERENCES public.menu_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    ingredients TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu Item Notes table
CREATE TABLE IF NOT EXISTS public.menu_item_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL,
    note_type VARCHAR,
    content TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Menu Uploads table
CREATE TABLE IF NOT EXISTS public.menu_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    file_url TEXT,
    status TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    status TEXT,
    total_amount NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS menu_item_notes_menu_item_id_idx ON public.menu_item_notes(menu_item_id);
CREATE INDEX IF NOT EXISTS menu_items_restaurant_id_idx ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_categories_restaurant_id_idx ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_uploads_restaurant_id_idx ON public.menu_uploads(restaurant_id);
CREATE INDEX IF NOT EXISTS orders_restaurant_id_idx ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS profiles_restaurant_id_idx ON public.profiles(restaurant_id);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Restaurants policies
CREATE POLICY "Users can view own restaurant"
    ON public.restaurants
    FOR SELECT
    USING (
        id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update own restaurant"
    ON public.restaurants
    FOR UPDATE
    USING (
        id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert restaurant"
    ON public.restaurants
    FOR INSERT
    WITH CHECK (true);

-- Menu Categories policies
CREATE POLICY "Users can view own menu categories"
    ON public.menu_categories
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update own menu categories"
    ON public.menu_categories
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own menu categories"
    ON public.menu_categories
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Menu Items policies
CREATE POLICY "Users can view own menu items"
    ON public.menu_items
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update own menu items"
    ON public.menu_items
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own menu items"
    ON public.menu_items
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Menu Item Notes policies
CREATE POLICY "Users can view own menu item notes"
    ON public.menu_item_notes
    FOR SELECT
    USING (
        menu_item_id IN (
            SELECT id 
            FROM public.menu_items 
            WHERE restaurant_id IN (
                SELECT restaurant_id 
                FROM public.profiles 
                WHERE profiles.id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own menu item notes"
    ON public.menu_item_notes
    FOR UPDATE
    USING (
        menu_item_id IN (
            SELECT id 
            FROM public.menu_items 
            WHERE restaurant_id IN (
                SELECT restaurant_id 
                FROM public.profiles 
                WHERE profiles.id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert own menu item notes"
    ON public.menu_item_notes
    FOR INSERT
    WITH CHECK (
        menu_item_id IN (
            SELECT id 
            FROM public.menu_items 
            WHERE restaurant_id IN (
                SELECT restaurant_id 
                FROM public.profiles 
                WHERE profiles.id = auth.uid()
            )
        )
    );

-- Menu Uploads policies
CREATE POLICY "Users can view own menu uploads"
    ON public.menu_uploads
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update own menu uploads"
    ON public.menu_uploads
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own menu uploads"
    ON public.menu_uploads
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Orders policies
CREATE POLICY "Users can view own orders"
    ON public.orders
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update own orders"
    ON public.orders
    FOR UPDATE
    USING (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id 
            FROM public.profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
    BEFORE UPDATE ON menu_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_item_notes_updated_at
    BEFORE UPDATE ON menu_item_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_uploads_updated_at
    BEFORE UPDATE ON menu_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create a profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
