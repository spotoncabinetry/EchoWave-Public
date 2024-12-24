-- Disable RLS temporarily
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg(
            format('DROP POLICY IF EXISTS %I ON public.restaurants;', 
                   policyname),
            E'\n'
        )
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'restaurants'
    );
END $$;

-- Create a single policy for testing
CREATE POLICY "authenticated_can_all"
ON public.restaurants
AS PERMISSIVE
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.restaurants TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
