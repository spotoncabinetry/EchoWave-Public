-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create menu_uploads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.menu_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    file_url VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for menu_uploads
CREATE INDEX IF NOT EXISTS menu_uploads_profile_id_idx ON public.menu_uploads(profile_id);
CREATE INDEX IF NOT EXISTS menu_uploads_status_idx ON public.menu_uploads(status);

-- Create storage bucket for menu files
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-files', 'menu-files', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on menu-related tables
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can create their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can update their own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Users can delete their own menu items" ON public.menu_items;

DROP POLICY IF EXISTS "Users can view their own menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can create their own menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can update their own menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Users can delete their own menu categories" ON public.menu_categories;

DROP POLICY IF EXISTS "Users can view their own menu uploads" ON public.menu_uploads;
DROP POLICY IF EXISTS "Users can create their own menu uploads" ON public.menu_uploads;
DROP POLICY IF EXISTS "Users can update their own menu uploads" ON public.menu_uploads;

-- Menu Items Policies
CREATE POLICY "Users can view their own menu items"
ON public.menu_items FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own menu items"
ON public.menu_items FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own menu items"
ON public.menu_items FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own menu items"
ON public.menu_items FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Menu Categories Policies
CREATE POLICY "Users can view their own menu categories"
ON public.menu_categories FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own menu categories"
ON public.menu_categories FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own menu categories"
ON public.menu_categories FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own menu categories"
ON public.menu_categories FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Menu Uploads Policies
CREATE POLICY "Users can view their own menu uploads"
ON public.menu_uploads FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Users can create their own menu uploads"
ON public.menu_uploads FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own menu uploads"
ON public.menu_uploads FOR UPDATE
TO authenticated
USING (profile_id = auth.uid());

-- Storage policies for menu-files bucket
DROP POLICY IF EXISTS "Users can upload their own menu files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own menu files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own menu files" ON storage.objects;
DROP POLICY IF EXISTS "Menu files are publicly accessible" ON storage.objects;

CREATE POLICY "Users can upload their own menu files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'menu-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own menu files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own menu files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'menu-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Menu files are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu-files');

-- Add trigger for updating menu_uploads updated_at
CREATE OR REPLACE FUNCTION update_menu_upload_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_menu_upload_updated_at_trigger ON public.menu_uploads;
CREATE TRIGGER update_menu_upload_updated_at_trigger
    BEFORE UPDATE ON public.menu_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_upload_updated_at();
