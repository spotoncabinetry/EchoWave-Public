-- Step 1: Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Step 2: Create Policies for agents table
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

CREATE POLICY "Users can insert their restaurant's agent"
    ON agents FOR INSERT
    WITH CHECK (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Step 3: Create Policies for orders table
CREATE POLICY "Users can view their restaurant's orders"
    ON orders FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their restaurant's orders"
    ON orders FOR UPDATE
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert orders for their restaurant"
    ON orders FOR INSERT
    WITH CHECK (restaurant_id IN (
        SELECT id FROM restaurants WHERE user_id = auth.uid()
    ));

-- Step 4: Create Policies for customers table
CREATE POLICY "Users can view customers from their orders"
    ON customers FOR SELECT
    USING (order_id IN (
        SELECT o.id 
        FROM orders o
        JOIN restaurants r ON r.id = o.restaurant_id 
        WHERE r.user_id = auth.uid()
    ));

CREATE POLICY "Users can update customers from their orders"
    ON customers FOR UPDATE
    USING (order_id IN (
        SELECT o.id 
        FROM orders o
        JOIN restaurants r ON r.id = o.restaurant_id 
        WHERE r.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert customers for their orders"
    ON customers FOR INSERT
    WITH CHECK (order_id IN (
        SELECT o.id 
        FROM orders o
        JOIN restaurants r ON r.id = o.restaurant_id 
        WHERE r.user_id = auth.uid()
    ));
