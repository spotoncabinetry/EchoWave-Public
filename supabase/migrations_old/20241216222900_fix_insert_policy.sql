-- Drop the problematic insert policy
DROP POLICY IF EXISTS "restaurants_insert_policy" ON public.restaurants;

-- Create a simpler insert policy
CREATE POLICY "restaurants_insert_policy"
ON public.restaurants
FOR INSERT
TO authenticated
WITH CHECK (
    -- Simply check if the user_id matches the authenticated user
    user_id = auth.uid()
);
