-- Enable Row Level Security
ALTER TABLE menu_item_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Menu Items policies
CREATE POLICY "Users can view their restaurant's menu items"
    ON menu_items FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their restaurant's menu items"
    ON menu_items FOR UPDATE
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Menu Categories policies
CREATE POLICY "Users can view their restaurant's menu categories"
    ON menu_categories FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their restaurant's menu categories"
    ON menu_categories FOR UPDATE
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Menu Item Notes policies
CREATE POLICY "Users can view their restaurant's menu item notes"
    ON menu_item_notes FOR SELECT
    USING (menu_item_id IN (
        SELECT mi.id 
        FROM menu_items mi
        JOIN restaurants r ON r.id = mi.restaurant_id 
        WHERE r.user_id = auth.uid()
    ));

-- Menu Uploads policies
CREATE POLICY "Users can view their restaurant's menu uploads"
    ON menu_uploads FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Orders policies
CREATE POLICY "Users can view their restaurant's orders"
    ON orders FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Customers policies
CREATE POLICY "Users can view their restaurant's customers"
    ON customers FOR SELECT
    USING (order_id IN (
        SELECT o.id 
        FROM orders o
        JOIN restaurants r ON r.id = o.restaurant_id 
        WHERE r.user_id = auth.uid()
    ));

-- Agents policies
CREATE POLICY "Users can view their restaurant's agent"
    ON agents FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their restaurant's agent"
    ON agents FOR UPDATE
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Restaurant policies
CREATE POLICY "Users can view their own restaurant"
    ON restaurants FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own restaurant"
    ON restaurants FOR UPDATE
    USING (user_id = auth.uid());

-- Profile policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = auth_users_id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = auth_users_id);
