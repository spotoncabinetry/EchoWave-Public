BEGIN;

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(restaurant_id, name)
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    ingredients TEXT[],
    image_url VARCHAR,
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    special_tag VARCHAR CHECK (special_tag IN ('special_of_day', 'seasonal', 'featured', NULL)),
    dietary_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS menu_categories_restaurant_id_idx ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_categories_display_order_idx ON public.menu_categories(display_order);

CREATE INDEX IF NOT EXISTS menu_items_restaurant_id_idx ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_items_display_order_idx ON public.menu_items(display_order);
CREATE INDEX IF NOT EXISTS menu_items_is_available_idx ON public.menu_items(is_available);
CREATE INDEX IF NOT EXISTS menu_items_special_tag_idx ON public.menu_items(special_tag);

-- Add triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_categories_updated_at ON menu_categories;
CREATE TRIGGER update_menu_categories_updated_at
    BEFORE UPDATE ON menu_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_menu_items_updated_at ON menu_items;
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for processing menu uploads
CREATE OR REPLACE FUNCTION process_menu_upload(
    p_upload_id UUID,
    p_menu_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
    v_category_record RECORD;
    v_item_record RECORD;
    v_category_id UUID;
    v_order INTEGER;
BEGIN
    -- Get restaurant_id from upload record
    SELECT restaurant_id INTO v_restaurant_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'Restaurant ID not found for upload %', p_upload_id;
    END IF;

    -- Delete existing categories and items for this restaurant
    DELETE FROM menu_items WHERE restaurant_id = v_restaurant_id;
    DELETE FROM menu_categories WHERE restaurant_id = v_restaurant_id;

    -- Process each category
    v_order := 0;
    FOR v_category_record IN 
        SELECT value FROM jsonb_array_elements(p_menu_data->'categories')
    LOOP
        v_order := v_order + 1;
        
        -- Insert category
        INSERT INTO menu_categories (
            restaurant_id,
            name,
            description,
            display_order
        )
        VALUES (
            v_restaurant_id,
            v_category_record.value->>'name',
            v_category_record.value->>'description',
            v_order
        )
        RETURNING id INTO v_category_id;

        -- Process items in this category
        FOR v_item_record IN 
            SELECT value, ordinality 
            FROM jsonb_array_elements(v_category_record.value->'items') WITH ORDINALITY
        LOOP
            -- Extract price from the price string (remove currency symbols and convert to numeric)
            INSERT INTO menu_items (
                restaurant_id,
                category_id,
                name,
                description,
                price,
                is_available,
                display_order,
                dietary_info,
                special_tag
            )
            VALUES (
                v_restaurant_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                COALESCE(
                    (v_item_record.value->>'base_price')::numeric,
                    REGEXP_REPLACE(v_item_record.value->>'price', '[^0-9.]', '', 'g')::numeric
                ),
                true,
                v_item_record.ordinality,
                CASE 
                    WHEN v_item_record.value ? 'dietary_info' 
                    THEN v_item_record.value->'dietary_info' 
                    ELSE NULL::jsonb 
                END,
                CASE 
                    WHEN v_item_record.value->>'special_tag' IN ('special_of_day', 'seasonal', 'featured')
                    THEN v_item_record.value->>'special_tag'
                    ELSE NULL 
                END
            );
        END LOOP;
    END LOOP;

    -- Update special notes in the menu_uploads metadata if present
    IF p_menu_data ? 'special_notes' THEN
        UPDATE menu_uploads
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{special_notes}',
            p_menu_data->'special_notes'
        )
        WHERE id = p_upload_id;
    END IF;
END;
$$;

-- Enable RLS
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view all menu categories"
    ON public.menu_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Restaurant owners can manage their menu categories"
    ON public.menu_categories FOR ALL
    TO authenticated
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can view all menu items"
    ON public.menu_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Restaurant owners can manage their menu items"
    ON public.menu_items FOR ALL
    TO authenticated
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

COMMIT;
