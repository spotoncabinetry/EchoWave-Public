-- Menu uploads table schema
CREATE TABLE IF NOT EXISTS public.menu_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) NOT NULL,
    file_url VARCHAR NOT NULL,
    file_type VARCHAR NOT NULL,
    status VARCHAR NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB, -- Store extracted metadata about the menu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS menu_uploads_profile_id_idx ON public.menu_uploads(profile_id);
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
