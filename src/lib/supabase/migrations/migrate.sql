-- Drop existing tables
DROP TABLE IF EXISTS public.menu_item_notes CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.menu_categories CASCADE;

-- Create menu categories table
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

-- Create menu items table
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
    dietary_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create menu item notes table
CREATE TABLE IF NOT EXISTS public.menu_item_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    note_type VARCHAR NOT NULL CHECK (note_type IN ('general', 'out_of_stock', 'special')),
    content TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS menu_categories_profile_id_idx ON public.menu_categories(profile_id);
CREATE INDEX IF NOT EXISTS menu_categories_display_order_idx ON public.menu_categories(display_order);

CREATE INDEX IF NOT EXISTS menu_items_profile_id_idx ON public.menu_items(profile_id);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_items_is_available_idx ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS menu_items_special_tag_idx ON public.menu_items(special_tag);

CREATE INDEX IF NOT EXISTS menu_item_notes_menu_item_id_idx ON public.menu_item_notes(menu_item_id);
CREATE INDEX IF NOT EXISTS menu_item_notes_note_type_idx ON public.menu_item_notes(note_type);
CREATE INDEX IF NOT EXISTS menu_item_notes_expires_at_idx ON public.menu_item_notes(expires_at);

-- Enable Row Level Security
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for menu categories
CREATE POLICY "Anyone can view menu categories"
    ON public.menu_categories
    FOR SELECT
    USING (true);

CREATE POLICY "Restaurant owners can manage their menu categories"
    ON public.menu_categories
    FOR ALL
    USING (auth.uid() = profile_id);

-- Create policies for menu items
CREATE POLICY "Anyone can view menu items"
    ON public.menu_items
    FOR SELECT
    USING (true);

CREATE POLICY "Restaurant owners can manage their menu items"
    ON public.menu_items
    FOR ALL
    USING (auth.uid() = profile_id);

-- Create policies for menu item notes
CREATE POLICY "Anyone can view menu item notes"
    ON public.menu_item_notes
    FOR SELECT
    USING (true);

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

-- Create sync profiles function
CREATE OR REPLACE FUNCTION sync_auth_users_to_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert profiles for any auth users that don't have them
    INSERT INTO public.profiles (id, email, role)
    SELECT 
        au.id,
        au.email,
        'user' as role
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL;
END;
$$;

-- Execute the sync function
SELECT sync_auth_users_to_profiles();
