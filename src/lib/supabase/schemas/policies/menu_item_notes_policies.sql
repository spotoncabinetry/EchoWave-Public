-- Menu item notes table Row Level Security (RLS) policies
ALTER TABLE public.menu_item_notes ENABLE ROW LEVEL SECURITY;

-- Policy for viewing menu item notes (public access)
DROP POLICY IF EXISTS "Anyone can view menu item notes" ON public.menu_item_notes;
CREATE POLICY "Anyone can view menu item notes"
    ON public.menu_item_notes
    FOR SELECT
    USING (true);

-- Policy for restaurant owners to manage their menu item notes
DROP POLICY IF EXISTS "Restaurant owners can manage their menu item notes" ON public.menu_item_notes;
CREATE POLICY "Restaurant owners can manage their menu item notes"
    ON public.menu_item_notes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.menu_items
            WHERE id = menu_item_notes.menu_item_id
            AND profile_id = auth.uid()
        )
    );
