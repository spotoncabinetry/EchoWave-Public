BEGIN;

-- Update menu_categories table
ALTER TABLE public.menu_categories
DROP COLUMN IF EXISTS restaurant_id;

ALTER TABLE public.menu_categories
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'menu_categories_profile_id_fkey'
          AND table_name = 'menu_categories'
          AND constraint_schema = 'public'
    ) THEN
        ALTER TABLE public.menu_categories
        ADD CONSTRAINT menu_categories_profile_id_fkey
        FOREIGN KEY (profile_id)
        REFERENCES public.profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END;
$$;

-- Update menu_items table
ALTER TABLE public.menu_items
DROP COLUMN IF EXISTS restaurant_id;

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'menu_items_profile_id_fkey'
          AND table_name = 'menu_items'
          AND constraint_schema = 'public'
    ) THEN
        ALTER TABLE public.menu_items
        ADD CONSTRAINT menu_items_profile_id_fkey
        FOREIGN KEY (profile_id)
        REFERENCES public.profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
    END IF;
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS menu_categories_profile_id_idx ON public.menu_categories(profile_id);
CREATE INDEX IF NOT EXISTS menu_categories_position_idx ON public.menu_categories(position);
CREATE INDEX IF NOT EXISTS menu_categories_display_order_idx ON public.menu_categories(display_order);

CREATE INDEX IF NOT EXISTS menu_items_profile_id_idx ON public.menu_items(profile_id);
CREATE INDEX IF NOT EXISTS menu_items_position_idx ON public.menu_items(position);
CREATE INDEX IF NOT EXISTS menu_items_display_order_idx ON public.menu_items(display_order);

COMMIT;
