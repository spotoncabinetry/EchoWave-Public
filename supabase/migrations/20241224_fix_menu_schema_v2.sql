BEGIN;

-- Add display_order to menu_items if it doesn't exist
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for display_order on menu_items
CREATE INDEX IF NOT EXISTS menu_items_display_order_idx ON public.menu_items(display_order);

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
    v_profile_id UUID;
    v_category_record RECORD;
    v_item_record RECORD;
    v_category_id UUID;
    v_order INTEGER;
BEGIN
    -- Get profile_id from upload record
    SELECT profile_id INTO v_profile_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile ID not found for upload %', p_upload_id;
    END IF;

    -- Delete existing categories and items for this profile
    DELETE FROM menu_items WHERE profile_id = v_profile_id;
    DELETE FROM menu_categories WHERE profile_id = v_profile_id;

    -- Process each category
    v_order := 0;
    FOR v_category_record IN 
        SELECT value FROM jsonb_array_elements(p_menu_data->'categories')
    LOOP
        v_order := v_order + 1;
        
        -- Insert category
        INSERT INTO menu_categories (
            profile_id,
            name,
            description,
            display_order
        )
        VALUES (
            v_profile_id,
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
                profile_id,
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
                v_profile_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                COALESCE(
                    (v_item_record.value->>'base_price')::numeric,
                    REGEXP_REPLACE(v_item_record.value->>'price', '[^0-9.]', '', 'g')::numeric
                ),
                true, -- Default to available
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

COMMIT;
