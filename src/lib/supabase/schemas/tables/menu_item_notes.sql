-- Menu item notes table schema
CREATE TABLE IF NOT EXISTS public.menu_item_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    note_type VARCHAR NOT NULL CHECK (note_type IN ('general', 'out_of_stock', 'special')),
    content TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS menu_item_notes_menu_item_id_idx ON public.menu_item_notes(menu_item_id);
CREATE INDEX IF NOT EXISTS menu_item_notes_note_type_idx ON public.menu_item_notes(note_type);
CREATE INDEX IF NOT EXISTS menu_item_notes_expires_at_idx ON public.menu_item_notes(expires_at);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_item_note_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_menu_item_note_timestamp ON menu_item_notes;
CREATE TRIGGER update_menu_item_note_timestamp
    BEFORE UPDATE ON menu_item_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_note_updated_at();
