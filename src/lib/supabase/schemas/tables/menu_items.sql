-- Menu items table schema
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    category_id UUID REFERENCES public.menu_categories(id),
    name VARCHAR NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    ingredients TEXT[],
    image_url VARCHAR,
    is_available BOOLEAN DEFAULT true,
    special_tag VARCHAR CHECK (special_tag IN ('special_of_day', 'seasonal', 'featured', NULL)),
    dietary_info JSONB, -- For storing allergens, vegetarian/vegan status, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS menu_items_profile_id_idx ON public.menu_items(profile_id);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_items_is_available_idx ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS menu_items_special_tag_idx ON public.menu_items(special_tag);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_item_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_menu_item_timestamp ON menu_items;
CREATE TRIGGER update_menu_item_timestamp
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_updated_at();
