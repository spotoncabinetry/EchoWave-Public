-- Baseline schema snapshot taken on 2024-12-22
-- Tables
CREATE TABLE menu_categories (
    id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE menu_item_notes (
    id uuid NOT NULL,
    menu_item_id uuid NOT NULL,
    note_type character varying,
    content text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE menu_items (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    image_url text,
    is_available boolean,
    ingredients text[],
    restaurant_id uuid NOT NULL,
    category_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE menu_uploads (
    id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    file_url text,
    status text,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE orders (
    id uuid NOT NULL,
    restaurant_id uuid NOT NULL,
    customer_name text,
    customer_email text,
    customer_phone text,
    status text,
    total_amount numeric,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    address text,
    phone_number character varying,
    role text,
    restaurant_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

CREATE TABLE restaurants (
    id uuid NOT NULL,
    name text NOT NULL,
    address text,
    phone_number text,
    user_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their restaurant's menu uploads" 
    ON menu_uploads FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM restaurants 
        WHERE restaurants.id = menu_uploads.restaurant_id 
        AND restaurants.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own profiles" 
    ON profiles FOR SELECT TO authenticated 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profiles" 
    ON profiles FOR UPDATE TO authenticated 
    USING (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id" 
    ON restaurants FOR SELECT TO authenticated 
    USING (id IN (
        SELECT profiles.restaurant_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    ));

CREATE POLICY "Enable update for users based on user_id" 
    ON restaurants FOR UPDATE TO authenticated 
    USING (id IN (
        SELECT profiles.restaurant_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    ));

CREATE POLICY "Enable delete for users based on user_id" 
    ON restaurants FOR DELETE TO authenticated 
    USING (id IN (
        SELECT profiles.restaurant_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
    ));

CREATE POLICY "Authenticated users can view all restaurants" 
    ON restaurants FOR SELECT TO authenticated 
    USING (true);

-- Triggers
CREATE TRIGGER update_restaurants_updated_at 
    BEFORE UPDATE ON restaurants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_uploads_updated_at 
    BEFORE UPDATE ON menu_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
