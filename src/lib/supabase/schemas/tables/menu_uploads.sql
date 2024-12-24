-- Menu uploads table schema
CREATE TABLE IF NOT EXISTS public.menu_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    file_url TEXT NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store metadata about the upload (filename, size, etc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS menu_uploads_restaurant_id_idx ON public.menu_uploads(restaurant_id);
CREATE INDEX IF NOT EXISTS menu_uploads_status_idx ON public.menu_uploads(status);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_upload_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_upload_updated_at_trigger
    BEFORE UPDATE ON public.menu_uploads
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_upload_updated_at();

-- Enable Row Level Security
ALTER TABLE public.menu_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for menu_uploads table
CREATE POLICY "Users can view their restaurant's menu uploads"
ON public.menu_uploads FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id = menu_uploads.restaurant_id
    )
);

CREATE POLICY "Users can create menu uploads for their restaurant"
ON public.menu_uploads FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id = menu_uploads.restaurant_id
    )
);

CREATE POLICY "Users can update their restaurant's menu uploads"
ON public.menu_uploads FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id = menu_uploads.restaurant_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id = menu_uploads.restaurant_id
    )
);

CREATE POLICY "Users can delete their restaurant's menu uploads"
ON public.menu_uploads FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.restaurant_id = menu_uploads.restaurant_id
    )
);
