-- First, drop existing policies for menu_uploads
DROP POLICY IF EXISTS "Enable read access for authenticated users uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Enable insert for authenticated users uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Enable update for service role uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Enable update for users uploads" ON menu_uploads;

-- Enable RLS on menu_uploads
ALTER TABLE menu_uploads ENABLE ROW LEVEL SECURITY;

-- Create new policies for menu_uploads
CREATE POLICY "Enable read for users based on profile_id"
ON menu_uploads FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Enable insert for users based on profile_id"
ON menu_uploads FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Enable insert for service role"
ON menu_uploads FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Enable update for users based on profile_id"
ON menu_uploads FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Enable update for service role"
ON menu_uploads FOR UPDATE
TO service_role
USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON menu_uploads TO authenticated;
GRANT ALL ON menu_uploads TO service_role;

-- Also ensure storage policies are correct
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'menu-files' AND
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    auth.role() = 'authenticated'
);
