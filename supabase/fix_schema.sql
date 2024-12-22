-- Disable RLS temporarily
ALTER TABLE IF EXISTS public.menu_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
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

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Update restaurants table
ALTER TABLE IF EXISTS public.restaurants 
  DROP CONSTRAINT IF EXISTS restaurants_owner_id_fkey,
  DROP COLUMN IF EXISTS owner_id,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD CONSTRAINT restaurants_user_id_key UNIQUE (user_id);

-- Update profiles table
ALTER TABLE IF EXISTS public.profiles
  DROP COLUMN IF EXISTS phone_number,
  DROP COLUMN IF EXISTS restaurant_name,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS business_hours;

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

-- Update existing data
UPDATE restaurants 
SET user_id = profiles.id 
FROM profiles 
WHERE restaurants.id = profiles.restaurant_id;
