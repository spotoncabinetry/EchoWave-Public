-- Drop all existing policies for menu_uploads
DROP POLICY IF EXISTS "Enable read for users based on profile_id" ON menu_uploads;
DROP POLICY IF EXISTS "Enable insert for users based on profile_id" ON menu_uploads;
DROP POLICY IF EXISTS "Enable insert for service role" ON menu_uploads;
DROP POLICY IF EXISTS "Enable update for users based on profile_id" ON menu_uploads;
DROP POLICY IF EXISTS "Enable update for service role" ON menu_uploads;
DROP POLICY IF EXISTS "Enable read access for authenticated users uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Enable insert for authenticated users uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Enable update for service role uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Enable update for users uploads" ON menu_uploads;

-- Enable RLS on menu_uploads
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for menu_uploads
CREATE POLICY "Allow authenticated users to insert their own uploads"
ON menu_uploads FOR INSERT 
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Allow authenticated users to view their own uploads"
ON menu_uploads FOR SELECT 
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Allow authenticated users to update their own uploads"
ON menu_uploads FOR UPDATE 
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Allow service role full access"
ON menu_uploads FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own menu files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own menu files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own menu files" ON storage.objects;
DROP POLICY IF EXISTS "Menu files are publicly accessible" ON storage.objects;

-- Create simplified storage policies
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
GRANT ALL ON menu_uploads TO service_role;
