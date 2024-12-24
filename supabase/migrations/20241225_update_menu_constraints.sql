-- Drop existing constraints and indexes
ALTER TABLE menu_categories
DROP CONSTRAINT IF EXISTS menu_categories_restaurant_id_name_key;
DROP INDEX IF EXISTS menu_categories_display_order_idx;
DROP CONSTRAINT IF EXISTS menu_categories_display_order_check;
DROP CONSTRAINT IF EXISTS menu_categories_position_check;

ALTER TABLE menu_items
DROP CONSTRAINT IF EXISTS menu_items_restaurant_id_category_id_name_key;
DROP INDEX IF EXISTS menu_items_display_order_idx;
DROP CONSTRAINT IF EXISTS menu_items_display_order_check;
DROP CONSTRAINT IF EXISTS menu_items_position_check;

-- Update menu_categories constraints
ALTER TABLE menu_categories
ADD CONSTRAINT menu_categories_restaurant_id_name_key UNIQUE (restaurant_id, name);

-- Update menu_items constraints
ALTER TABLE menu_items
ADD CONSTRAINT menu_items_restaurant_id_category_id_name_key UNIQUE (restaurant_id, category_id, name);

-- Update indexes for ordering
CREATE INDEX menu_categories_display_order_idx ON menu_categories (restaurant_id, display_order);
CREATE INDEX menu_items_display_order_idx ON menu_items (restaurant_id, category_id, display_order);

-- Add check constraints for ordering fields
ALTER TABLE menu_categories
ADD CONSTRAINT menu_categories_display_order_check CHECK (display_order >= 0),
ADD CONSTRAINT menu_categories_position_check CHECK (position >= 0);

ALTER TABLE menu_items
ADD CONSTRAINT menu_items_display_order_check CHECK (display_order >= 0),
ADD CONSTRAINT menu_items_position_check CHECK (position >= 0);
