-- Menu categories table Row Level Security (RLS) policies
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Policy for viewing menu categories (public access)
DROP POLICY IF EXISTS "Anyone can view menu categories" ON public.menu_categories;
CREATE POLICY "Anyone can view menu categories"
    ON public.menu_categories
    FOR SELECT
    USING (true);

-- Policy for restaurant owners to manage their menu categories
DROP POLICY IF EXISTS "Restaurant owners can manage their menu categories" ON public.menu_categories;
CREATE POLICY "Restaurant owners can manage their menu categories"
    ON public.menu_categories
    FOR ALL
    USING (auth.uid() = profile_id);
