-- Enable RLS on all menu-related tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;

-- Menu Items Policies
CREATE POLICY "Users can view their own menu items"
ON public.menu_items FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own menu items"
ON public.menu_items FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own menu items"
ON public.menu_items FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own menu items"
ON public.menu_items FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Menu Categories Policies
CREATE POLICY "Users can view their own menu categories"
ON public.menu_categories FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own menu categories"
ON public.menu_categories FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own menu categories"
ON public.menu_categories FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own menu categories"
ON public.menu_categories FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Menu Uploads Policies
CREATE POLICY "Users can view their own menu uploads"
ON public.menu_uploads FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own menu uploads"
ON public.menu_uploads FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own menu uploads"
ON public.menu_uploads FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());
