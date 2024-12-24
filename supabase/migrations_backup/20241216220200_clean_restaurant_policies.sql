-- First, drop all existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.restaurants;
DROP POLICY IF EXISTS "Enable select for restaurant owners" ON public.restaurants;
DROP POLICY IF EXISTS "Enable update for restaurant owners" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_policy" ON public.restaurants;
DROP POLICY IF EXISTS "view_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "insert_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "update_restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "delete_restaurants" ON public.restaurants;

-- Make sure RLS is enabled
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Create a single, simple insert policy for signup
CREATE POLICY "restaurants_insert_policy"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (
    -- During signup, allow any authenticated user to create one restaurant
    NOT EXISTS (
        SELECT 1 FROM restaurants r
        WHERE r.user_id = auth.uid()
    )
);

-- Create policy for viewing own restaurant
CREATE POLICY "restaurants_select_policy"
ON public.restaurants
FOR SELECT
TO authenticated
USING (
    -- Can view if you own the restaurant
    user_id = auth.uid()
);

-- Create policy for updating own restaurant
CREATE POLICY "restaurants_update_policy"
ON public.restaurants
FOR UPDATE
TO authenticated
USING (
    -- Can update if you own the restaurant
    user_id = auth.uid()
)
WITH CHECK (
    -- Can only set user_id to yourself
    user_id = auth.uid()
);

-- Create policy for deleting own restaurant
CREATE POLICY "restaurants_delete_policy"
ON public.restaurants
FOR DELETE
TO authenticated
USING (
    -- Can delete if you own the restaurant
    user_id = auth.uid()
);
