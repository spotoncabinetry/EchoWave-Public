-- Menu categories table schema
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, name)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS menu_categories_profile_id_idx ON public.menu_categories(profile_id);
CREATE INDEX IF NOT EXISTS menu_categories_display_order_idx ON public.menu_categories(display_order);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_category_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_menu_category_timestamp ON menu_categories;
CREATE TRIGGER update_menu_category_timestamp
    BEFORE UPDATE ON menu_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_category_updated_at();
