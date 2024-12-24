-- First, disable RLS temporarily
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies for restaurants
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.restaurants;
DROP POLICY IF EXISTS "Enable select for restaurant owners" ON public.restaurants;
DROP POLICY IF EXISTS "Enable update for restaurant owners" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_policy" ON public.restaurants;
DROP POLICY IF EXISTS "view_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "insert_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "update_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "delete_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_policy" ON public.restaurants;

-- Re-enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Create a single, simple policy for all operations
CREATE POLICY "allow_all_authenticated"
ON public.restaurants
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Verify the user_id column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.restaurants
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
