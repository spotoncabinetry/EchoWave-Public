-- Update process_menu_upload function to handle array structure
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
    v_max_display_order INT;
BEGIN
    -- Get restaurant_id from upload record
    SELECT restaurant_id INTO v_restaurant_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    -- Process each category
    FOR v_category_record IN 
        SELECT value FROM jsonb_array_elements(p_menu_data->'categories')
    LOOP
        -- Get max display_order for categories
        SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_max_display_order
        FROM menu_categories
        WHERE restaurant_id = v_restaurant_id;

        -- Insert or update category
        INSERT INTO menu_categories (
            restaurant_id,
            name,
            description,
            position,
            display_order
        )
        VALUES (
            v_restaurant_id,
            v_category_record.value->>'name',
            v_category_record.value->>'description',
            v_max_display_order,
            v_max_display_order
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
            -- Get max display_order for items in this category
            SELECT COALESCE(MAX(display_order), -1) + 1 INTO v_max_display_order
            FROM menu_items
            WHERE restaurant_id = v_restaurant_id
            AND category_id = v_category_id;

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
                COALESCE((v_item_record.value->>'base_price')::numeric, 0),
                ARRAY(
                    SELECT jsonb_array_elements_text(
                        COALESCE(v_item_record.value->'ingredients', '[]'::jsonb)
                    )
                ),
                v_item_record.value->'dietary_info',
                v_max_display_order,
                v_max_display_order
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
