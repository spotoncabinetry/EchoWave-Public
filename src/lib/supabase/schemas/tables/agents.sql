-- Create agents table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) NOT NULL,
    agent_greeting TEXT NOT NULL DEFAULT 'Hello! Welcome to our restaurant.',
    agent_store_hours TEXT,
    agent_daily_specials TEXT,
    menu_enabled BOOLEAN DEFAULT true,
    menu_items_enabled BOOLEAN DEFAULT true,
    menu_categories_enabled BOOLEAN DEFAULT true,
    voice_id VARCHAR DEFAULT 'alloy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS agents_restaurant_id_idx ON public.agents(restaurant_id);

-- Add trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_agent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_timestamp
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_updated_at();
