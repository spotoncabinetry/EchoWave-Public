-- Enable RLS on menu_uploads table if not already enabled
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their restaurant's menu uploads" ON menu_uploads;
DROP POLICY IF EXISTS "Users can insert menu uploads for their restaurant" ON menu_uploads; -- Updated to match the existing policy name
DROP POLICY IF EXISTS "Users can update their restaurant's menu uploads" ON menu_uploads;

-- Create policies for menu_uploads that align with the restaurant-user relationship
CREATE POLICY "Users can insert menu uploads for their restaurant"
ON menu_uploads FOR INSERT TO authenticated
WITH CHECK (
    restaurant_id IN (
        SELECT profiles.restaurant_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id IS NOT NULL
    )
);

CREATE POLICY "Users can update their restaurant's menu uploads"
ON menu_uploads FOR UPDATE TO authenticated
USING (
    restaurant_id IN (
        SELECT profiles.restaurant_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id IS NOT NULL
    )
);

CREATE POLICY "Users can view their restaurant's menu uploads"
ON menu_uploads FOR SELECT TO authenticated
USING (
    restaurant_id IN (
        SELECT profiles.restaurant_id 
        FROM profiles 
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id IS NOT NULL
    )
);

-- Update storage policy for menu-files bucket
DROP POLICY IF EXISTS "Users can upload their own menu files" ON storage.objects;
CREATE POLICY "Users can upload menu files for their restaurant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'menu-files' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id::text = (storage.foldername(name))[1]
        AND profiles.restaurant_id IS NOT NULL
    )
);

-- Add policy for updating storage objects
CREATE POLICY "Users can update menu files for their restaurant"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id::text = (storage.foldername(name))[1]
        AND profiles.restaurant_id IS NOT NULL
    )
);

-- Add policy for deleting storage objects
CREATE POLICY "Users can delete menu files for their restaurant"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id::text = (storage.foldername(name))[1]
        AND profiles.restaurant_id IS NOT NULL
    )
);

-- Add policy for viewing storage objects (public access)
CREATE POLICY "Menu files are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-files');