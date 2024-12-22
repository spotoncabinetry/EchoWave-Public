-- Menu items table Row Level Security (RLS) policies
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Policy for viewing menu items (public access)
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items"
    ON public.menu_items
    FOR SELECT
    USING (true);

-- Policy for restaurant owners to manage their menu items
DROP POLICY IF EXISTS "Restaurant owners can manage their menu items" ON public.menu_items;
CREATE POLICY "Restaurant owners can manage their menu items"
    ON public.menu_items
    FOR ALL
    USING (
        auth.uid() = profile_id
    );
