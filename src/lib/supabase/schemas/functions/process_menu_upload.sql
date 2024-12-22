CREATE OR REPLACE FUNCTION process_menu_upload(
    p_upload_id UUID,
    p_menu_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
    v_category_record RECORD;
    v_item_record RECORD;
    v_category_id UUID;
BEGIN
    -- Get profile_id from upload record
    SELECT profile_id INTO v_profile_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    -- Process each category
    FOR v_category_record IN 
        SELECT * FROM jsonb_each(p_menu_data->'categories')
    LOOP
        -- Insert or update category
        INSERT INTO menu_categories (profile_id, name, description)
        VALUES (
            v_profile_id,
            v_category_record.value->>'name',
            v_category_record.value->>'description'
        )
        ON CONFLICT (profile_id, name)
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
                profile_id,
                category_id,
                name,
                description,
                price,
                ingredients,
                dietary_info
            )
            VALUES (
                v_profile_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                (v_item_record.value->>'price')::numeric,
                ARRAY(SELECT jsonb_array_elements_text(v_item_record.value->'ingredients')),
                v_item_record.value->'dietary_info'
            )
            ON CONFLICT (profile_id, category_id, name)
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
