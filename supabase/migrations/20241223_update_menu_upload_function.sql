-- Drop existing function
DROP FUNCTION IF EXISTS process_menu_upload(UUID, JSONB);

-- Create updated function
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
    v_position INTEGER;
BEGIN
    -- Get restaurant_id from upload record
    SELECT restaurant_id INTO v_restaurant_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    -- Delete existing categories and items for this restaurant
    DELETE FROM menu_items WHERE restaurant_id = v_restaurant_id;
    DELETE FROM menu_categories WHERE restaurant_id = v_restaurant_id;

    -- Process each category
    v_position := 0;
    FOR v_category_record IN 
        SELECT value FROM jsonb_array_elements(p_menu_data->'categories')
    LOOP
        v_position := v_position + 1;
        
        -- Insert category
        INSERT INTO menu_categories (
            restaurant_id,
            name,
            description,
            position
        )
        VALUES (
            v_restaurant_id,
            v_category_record.value->>'name',
            v_category_record.value->>'description',
            v_position
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
                position
            )
            VALUES (
                v_restaurant_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                -- Remove currency symbols and convert to numeric
                REGEXP_REPLACE(v_item_record.value->>'price', '[^0-9.]', '', 'g')::numeric,
                true, -- Default to available
                v_item_record.ordinality
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
