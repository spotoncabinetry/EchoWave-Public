-- This migration ensures menu_item_notes is properly connected to menu_items
-- The foreign key constraint already exists in the table definition, but we'll ensure it's there

-- Verify the foreign key constraint exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'menu_item_notes_menu_item_id_fkey'
        AND table_name = 'menu_item_notes'
    ) THEN
        ALTER TABLE public.menu_item_notes
        ADD CONSTRAINT menu_item_notes_menu_item_id_fkey
        FOREIGN KEY (menu_item_id)
        REFERENCES public.menu_items (id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Note: We're not adding position/sort_order to menu_categories since it's not used in the codebase
-- If you need to add sorting functionality in the future, you can:
-- 1. First add the position column to menu_categories
-- 2. Then update the MenuList component to use the position for sorting
