-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert their own uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Allow authenticated users to view their own uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Allow authenticated users to update their own uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Allow service role full access" ON menu_uploads;

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON menu_uploads;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on categories" ON menu_categories;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on items" ON menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read menu files" ON storage.objects;

-- Enable RLS
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_uploads
CREATE POLICY "Enable insert for authenticated users"
ON menu_uploads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Enable select for authenticated users"
ON menu_uploads FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

CREATE POLICY "Enable update for authenticated users"
ON menu_uploads FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- Create policies for menu_categories
CREATE POLICY "Enable all operations for authenticated users on categories"
ON menu_categories FOR ALL
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Create policies for menu_items
CREATE POLICY "Enable all operations for authenticated users on items"
ON menu_items FOR ALL
TO authenticated
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- Storage policies
CREATE POLICY "Allow authenticated users to manage their own files"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'menu-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public to read menu files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-files');

-- Grant necessary permissions
GRANT ALL ON menu_uploads TO authenticated;
GRANT ALL ON menu_categories TO authenticated;
GRANT ALL ON menu_items TO authenticated;
