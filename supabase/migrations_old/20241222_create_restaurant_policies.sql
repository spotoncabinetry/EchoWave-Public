-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own restaurants"
    ON restaurants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own restaurants"
    ON restaurants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own restaurants"
    ON restaurants FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own restaurants"
    ON restaurants FOR DELETE
    USING (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT ALL ON restaurants TO authenticated;
