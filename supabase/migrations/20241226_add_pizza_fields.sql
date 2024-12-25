-- Add pizza-specific fields to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS add_ons JSONB,
ADD COLUMN IF NOT EXISTS possible_toppings TEXT[],
ADD COLUMN IF NOT EXISTS size_options JSONB;

-- Update process_menu_upload function to handle pizza-specific fields
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
    v_price_string TEXT;
    v_restaurant_id UUID;
    v_price_numeric NUMERIC;
BEGIN
    -- Validate input structure
    IF p_menu_data IS NULL THEN
        RAISE EXCEPTION 'Menu data cannot be null';
    END IF;

    IF NOT p_menu_data ? 'categories' THEN
        RAISE EXCEPTION 'Menu data must contain a "categories" field';
    END IF;

    IF NOT jsonb_typeof(p_menu_data->'categories') = 'array' THEN
        RAISE EXCEPTION 'Categories must be an array';
    END IF;

    -- Get restaurant_id from upload record
    SELECT restaurant_id INTO v_restaurant_id
    FROM menu_uploads
    WHERE id = p_upload_id;

    -- Process each category
    FOR v_category_record IN 
        SELECT value FROM jsonb_array_elements(p_menu_data->'categories')
    LOOP
        -- Validate category structure
        IF NOT v_category_record.value ? 'name' THEN
            RAISE EXCEPTION 'Category must have a name field';
        END IF;

        IF NOT v_category_record.value ? 'items' THEN
            RAISE EXCEPTION 'Category must have an items field';
        END IF;

        IF NOT jsonb_typeof(v_category_record.value->'items') = 'array' THEN
            RAISE EXCEPTION 'Category items must be an array';
        END IF;

        -- Log category processing
        RAISE NOTICE 'Processing category: %', v_category_record.value->>'name';

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
            SELECT value FROM jsonb_array_elements(v_category_record.value->'items')
        LOOP
            -- Validate item structure
            IF NOT v_item_record.value ? 'name' THEN
                RAISE EXCEPTION 'Menu item must have a name field';
            END IF;

            -- Log raw price values for debugging
            RAISE NOTICE 'Raw price values for item %:', v_item_record.value->>'name';
            RAISE NOTICE '  - base_price: %', v_item_record.value->>'base_price';
            
            -- Clean and extract price with detailed logging
            v_price_string := NULLIF(regexp_replace(v_item_record.value->>'base_price', '[^0-9\\.]','','g'), '');
            
            -- Log cleaned price string
            RAISE NOTICE 'Cleaned price string before cast: %', v_price_string;
            
            -- Validate price string format and range
            IF v_price_string IS NOT NULL AND v_price_string ~ '^[0-9]+\.?[0-9]*$' THEN
                -- Try to convert to numeric safely
                BEGIN
                    v_price_numeric := v_price_string::numeric;
                    
                    -- Validate price range (max 99999999.99 for NUMERIC(10,2))
                    IF v_price_numeric > 99999999.99 THEN
                        RAISE NOTICE 'Price too large for item %, using 0.00', v_item_record.value->>'name';
                        v_price_numeric := 0.00;
                    END IF;
                    
                    RAISE NOTICE 'Valid numeric price found: %', v_price_numeric;
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Error converting price for item %, using 0.00', v_item_record.value->>'name';
                    v_price_numeric := 0.00;
                END;
            ELSE
                RAISE NOTICE 'Invalid or missing price format for item: %', v_item_record.value->>'name';
                v_price_numeric := 0.00;
            END IF;

            -- Insert or update menu item with pizza-specific fields
            INSERT INTO menu_items (
                restaurant_id,
                category_id,
                name,
                description,
                price,
                ingredients,
                dietary_info,
                add_ons,
                possible_toppings,
                size_options
            )
            VALUES (
                v_restaurant_id,
                v_category_id,
                v_item_record.value->>'name',
                v_item_record.value->>'description',
                v_price_numeric,
                CASE 
                    WHEN jsonb_typeof(v_item_record.value->'ingredients') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text(v_item_record.value->'ingredients'))
                    ELSE NULL
                END,
                CASE 
                    WHEN jsonb_typeof(v_item_record.value->'dietary_info') = 'object'
                    THEN v_item_record.value->'dietary_info'
                    ELSE NULL
                END,
                CASE 
                    WHEN jsonb_typeof(v_item_record.value->'add_ons') = 'array'
                    THEN v_item_record.value->'add_ons'
                    ELSE NULL
                END,
                CASE 
                    WHEN jsonb_typeof(v_item_record.value->'possible_toppings') = 'array'
                    THEN ARRAY(SELECT jsonb_array_elements_text(v_item_record.value->'possible_toppings'))
                    ELSE NULL
                END,
                CASE 
                    WHEN jsonb_typeof(v_item_record.value->'size_options') = 'array'
                    THEN v_item_record.value->'size_options'
                    ELSE NULL
                END
            )
            ON CONFLICT (restaurant_id, category_id, name)
            DO UPDATE SET
                description = EXCLUDED.description,
                price = EXCLUDED.price,
                ingredients = EXCLUDED.ingredients,
                dietary_info = EXCLUDED.dietary_info,
                add_ons = EXCLUDED.add_ons,
                possible_toppings = EXCLUDED.possible_toppings,
                size_options = EXCLUDED.size_options,
                updated_at = NOW();
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Menu processing completed successfully';
END;
$$;
