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
            -- Insert menu item
            WITH inserted_item AS (
                INSERT INTO menu_items (
                    restaurant_id,
                    category_id,
                    name,
                    description,
                    price,
                    is_available,
                    display_order
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
                    v_item_record.ordinality
                )
                RETURNING id
            )
            -- Insert any notes for this item
            INSERT INTO menu_item_notes (
                menu_item_id,
                note_type,
                content,
                expires_at
            )
            SELECT 
                inserted_item.id,
                note->>'type',
                note->>'content',
                (note->>'expires_at')::timestamptz
            FROM inserted_item
            CROSS JOIN jsonb_array_elements(
                CASE 
                    WHEN v_item_record.value ? 'notes' 
                    THEN v_item_record.value->'notes'
                    ELSE '[]'::jsonb
                END
            ) AS note
            WHERE note->>'type' IN ('general', 'out_of_stock', 'special')
            AND note->>'content' IS NOT NULL;
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
