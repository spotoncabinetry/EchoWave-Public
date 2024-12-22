-- Restaurants table Row Level Security (RLS) policies
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own restaurants
DROP POLICY IF EXISTS "Users can view own restaurants" ON public.restaurants;
CREATE POLICY "Users can view own restaurants"
    ON public.restaurants
    FOR SELECT
    USING (auth.uid() = (SELECT id FROM public.profiles WHERE id = owner_id));

-- Policy for users to update their own restaurants
DROP POLICY IF EXISTS "Users can update own restaurants" ON public.restaurants;
CREATE POLICY "Users can update own restaurants"
    ON public.restaurants
    FOR UPDATE
    USING (auth.uid() = (SELECT id FROM public.profiles WHERE id = owner_id));

-- Policy for users to create their own restaurants
DROP POLICY IF EXISTS "Users can create restaurants" ON public.restaurants;
CREATE POLICY "Users can create restaurants"
    ON public.restaurants
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE id = auth.uid()
    ));

-- Policy for admins to view all restaurants
DROP POLICY IF EXISTS "Admins can view all restaurants" ON public.restaurants;
CREATE POLICY "Admins can view all restaurants"
    ON public.restaurants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy for admins to update any restaurant
DROP POLICY IF EXISTS "Admins can update any restaurant" ON public.restaurants;
CREATE POLICY "Admins can update any restaurant"
    ON public.restaurants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
