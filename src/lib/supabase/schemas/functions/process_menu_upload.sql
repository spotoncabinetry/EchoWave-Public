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
    v_clean_price_str TEXT;
    v_final_price NUMERIC;
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
        INSERT INTO menu_categories (restaurant_id, name, description)
        VALUES (
            v_restaurant_id,
            v_category_record.value->>'name',
            v_category_record.value->>'description'
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
            
            RAISE NOTICE 'Price string: %', v_item_record.value->>'price';
            
            -- Clean the price string
            v_clean_price_str := regexp_replace(v_item_record.value->>'price', '[^0-9\.]', '', 'g');
            RAISE NOTICE 'Price string after regex: %', v_clean_price_str;
            
            -- Determine the final price
            v_final_price := CASE
                WHEN v_clean_price_str IS NOT NULL AND v_clean_price_str <> '' THEN
                    v_clean_price_str::numeric
                ELSE
                    0.00
                END;
            RAISE NOTICE 'Final price: %', v_final_price;

            INSERT INTO menu_items (
                restaurant_id,
                category_id,
                name,
                description,
                price,
                ingredients,
                dietary_info
            )
            VALUES (
                v_restaurant_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                CASE
                    WHEN v_final_price IS NOT NULL THEN v_final_price
                    ELSE 0.00
                END,
                ARRAY(SELECT jsonb_array_elements_text(v_item_record.value->'ingredients')),
                v_item_record.value->'dietary_info'
            );
        END LOOP;
    END LOOP;
END;
$$;
