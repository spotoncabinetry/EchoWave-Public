-- Create storage bucket for menu files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-files', 'menu-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-files bucket
CREATE POLICY "Users can upload their own menu files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'menu-files' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id::text = (storage.foldername(name))[1]
    )
);

CREATE POLICY "Users can update their own menu files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id::text = (storage.foldername(name))[1]
    )
);

CREATE POLICY "Users can delete their own menu files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id::text = (storage.foldername(name))[1]
    )
);

CREATE POLICY "Menu files are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-files');
