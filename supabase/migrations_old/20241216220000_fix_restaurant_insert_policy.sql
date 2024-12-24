-- Drop existing insert policy
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.restaurants;
DROP POLICY IF EXISTS "insert_restaurants" ON public.restaurants;

-- Create a more permissive insert policy for signup
CREATE POLICY "insert_restaurants_during_signup"
    ON public.restaurants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- During signup, the user won't have a restaurant_id yet in their profile
        NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.restaurant_id IS NOT NULL
        )
        OR
        -- Allow admins to create restaurants
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
