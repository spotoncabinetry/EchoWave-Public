-- First disable RLS
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg(
            format('DROP POLICY IF EXISTS %I ON %I;', 
                   pol.policyname, 
                   tab.tablename),
            E'\n'
        )
        FROM pg_policies pol
        JOIN pg_tables tab ON pol.tablename = tab.tablename
        WHERE pol.schemaname = 'public'
    );
END $$;

-- Re-enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create a single permissive policy for restaurants during signup
CREATE POLICY "restaurants_policy"
ON public.restaurants
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a single permissive policy for profiles during signup
CREATE POLICY "profiles_policy"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
