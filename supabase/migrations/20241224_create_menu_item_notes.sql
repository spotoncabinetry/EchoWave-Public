BEGIN;

-- Create menu_item_notes table
CREATE TABLE IF NOT EXISTS public.menu_item_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    note_type VARCHAR NOT NULL CHECK (note_type IN ('general', 'out_of_stock', 'special')),
    content TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS menu_item_notes_menu_item_id_idx ON public.menu_item_notes(menu_item_id);
CREATE INDEX IF NOT EXISTS menu_item_notes_note_type_idx ON public.menu_item_notes(note_type);
CREATE INDEX IF NOT EXISTS menu_item_notes_expires_at_idx ON public.menu_item_notes(expires_at);

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_menu_item_note_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_menu_item_note_timestamp ON menu_item_notes;
CREATE TRIGGER update_menu_item_note_timestamp
    BEFORE UPDATE ON menu_item_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_item_note_updated_at();

-- Enable RLS
ALTER TABLE public.menu_item_notes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Anyone can view menu item notes"
    ON public.menu_item_notes
    FOR SELECT
    USING (true);

CREATE POLICY "Restaurant owners can manage their menu item notes"
    ON public.menu_item_notes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.menu_items mi
            JOIN public.restaurants r ON r.id = mi.restaurant_id
            WHERE mi.id = menu_item_notes.menu_item_id
            AND r.user_id = auth.uid()
        )
    );

COMMIT;
