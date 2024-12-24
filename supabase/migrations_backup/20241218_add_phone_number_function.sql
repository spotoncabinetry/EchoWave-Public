-- Create a function to add phone_number column
CREATE OR REPLACE FUNCTION add_phone_number_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'phone_number'
    ) THEN
        -- Add the column
        ALTER TABLE profiles ADD COLUMN phone_number VARCHAR;
        
        -- Set default value for existing rows
        UPDATE profiles SET phone_number = '';
    END IF;
END;
$$;
