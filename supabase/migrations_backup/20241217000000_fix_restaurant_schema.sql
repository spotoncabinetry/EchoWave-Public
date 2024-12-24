-- First, disable RLS to avoid policy conflicts
ALTER TABLE IF EXISTS public.menu_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can update their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Users can insert their own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON restaurants;
DROP POLICY IF EXISTS "Users can view their restaurant's menu uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Users can insert menu uploads for their restaurant" ON menu_uploads;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_menu_uploads_updated_at ON menu_uploads;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.menu_uploads CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.restaurants CASCADE;

-- Create restaurants table
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone_number TEXT,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT restaurants_user_id_key UNIQUE (user_id)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    restaurant_id UUID REFERENCES public.restaurants(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Create menu_uploads table
CREATE TABLE public.menu_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    file_url TEXT,
    status TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS restaurants_user_id_idx ON public.restaurants(user_id);
CREATE INDEX IF NOT EXISTS profiles_restaurant_id_idx ON public.profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_uploads_restaurant_id_idx ON public.menu_uploads(restaurant_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_uploads_updated_at
    BEFORE UPDATE ON public.menu_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for handling new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own restaurant"
ON public.restaurants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own restaurant"
ON public.restaurants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own restaurant"
ON public.restaurants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their restaurant's menu uploads"
ON public.menu_uploads FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_uploads.restaurant_id
    AND restaurants.user_id = auth.uid()
));

CREATE POLICY "Users can insert menu uploads for their restaurant"
ON public.menu_uploads FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM restaurants
    WHERE restaurants.id = menu_uploads.restaurant_id
    AND restaurants.user_id = auth.uid()
));
