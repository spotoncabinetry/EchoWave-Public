-- Standardize on restaurant_id for menu tables since that's what the frontend uses
-- and it makes more sense for the business logic (menus belong to restaurants)

-- Update menu_categories
ALTER TABLE menu_categories 
DROP CONSTRAINT IF EXISTS menu_categories_profile_id_fkey,
DROP COLUMN IF EXISTS profile_id;

-- Update menu_items
ALTER TABLE menu_items 
DROP CONSTRAINT IF EXISTS menu_items_profile_id_fkey,
DROP COLUMN IF EXISTS profile_id;

-- Update menu uploads
ALTER TABLE menu_uploads
DROP CONSTRAINT IF EXISTS menu_uploads_profile_id_fkey,
DROP COLUMN IF EXISTS profile_id;

-- Update process_menu_upload function to use restaurant_id
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
BEGIN
    -- Get restaurant_id from upload record
    SELECT restaurant_id INTO v_restaurant_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    -- Process each category
    FOR v_category_record IN 
        SELECT * FROM jsonb_each(p_menu_data->'categories')
    LOOP
        -- Insert or update category
        INSERT INTO menu_categories (restaurant_id, name, description, position, display_order)
        VALUES (
            v_restaurant_id,
            v_category_record.value->>'name',
            v_category_record.value->>'description',
            0, -- default position
            0  -- default display_order
        )
        ON CONFLICT (restaurant_id, name)
        DO UPDATE SET
            description = EXCLUDED.description,
            updated_at = NOW()
        RETURNING id INTO v_category_id;

        -- Process items in this category
        FOR v_item_record IN 
            SELECT * FROM jsonb_array_elements(v_category_record.value->'items')
        LOOP
            -- Insert or update menu item
            INSERT INTO menu_items (
                restaurant_id,
                category_id,
                name,
                description,
                price,
                ingredients,
                dietary_info,
                position,
                display_order
            )
            VALUES (
                v_restaurant_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                (v_item_record.value->>'price')::numeric,
                ARRAY(SELECT jsonb_array_elements_text(v_item_record.value->'ingredients')),
                v_item_record.value->'dietary_info',
                0, -- default position
                0  -- default display_order
            )
            ON CONFLICT (restaurant_id, category_id, name)
            DO UPDATE SET
                description = EXCLUDED.description,
                price = EXCLUDED.price,
                ingredients = EXCLUDED.ingredients,
                dietary_info = EXCLUDED.dietary_info,
                updated_at = NOW();
        END LOOP;
    END LOOP;
END;
$$;

-- Update RLS policies to use restaurant_id instead of profile_id
DROP POLICY IF EXISTS "Restaurant owners can manage their menu items" ON menu_items;
CREATE POLICY "Restaurant owners can manage their menu items"
    ON menu_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.restaurant_id = menu_items.restaurant_id
        )
    );

DROP POLICY IF EXISTS "Restaurant owners can manage their menu categories" ON menu_categories;
CREATE POLICY "Restaurant owners can manage their menu categories"
    ON menu_categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.restaurant_id = menu_categories.restaurant_id
        )
    );

DROP POLICY IF EXISTS "Restaurant owners can manage their menu uploads" ON menu_uploads;
CREATE POLICY "Restaurant owners can manage their menu uploads"
    ON menu_uploads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.restaurant_id = menu_uploads.restaurant_id
        )
    );
