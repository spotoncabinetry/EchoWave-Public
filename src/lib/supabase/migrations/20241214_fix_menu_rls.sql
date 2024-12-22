-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON menu_items;
DROP POLICY IF EXISTS "Enable update for users based on profile_id" ON menu_items;
DROP POLICY IF EXISTS "Enable delete for users based on profile_id" ON menu_items;
DROP POLICY IF EXISTS "Enable read access for all users" ON menu_items;

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;

-- Menu Items Policies
CREATE POLICY "Enable read access for authenticated users"
ON menu_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for service role"
ON menu_items FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users with matching profile_id"
ON menu_items FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Enable update for service role"
ON menu_items FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Enable update for users based on profile_id"
ON menu_items FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

-- Menu Categories Policies
CREATE POLICY "Enable read access for authenticated users categories"
ON menu_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for service role categories"
ON menu_categories FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users categories"
ON menu_categories FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Enable update for service role categories"
ON menu_categories FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Enable update for users categories"
ON menu_categories FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

-- Menu Uploads Policies
CREATE POLICY "Enable read access for authenticated users uploads"
ON menu_uploads FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users uploads"
ON menu_uploads FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Enable update for service role uploads"
ON menu_uploads FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "Enable update for users uploads"
ON menu_uploads FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());
