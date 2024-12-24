-- Add user_id column to restaurants if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.restaurants
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update the insert policy to use user_id
ALTER POLICY "Enable insert for authenticated users"
ON public.restaurants
TO authenticated
WITH CHECK (
    auth.uid() = user_id  -- Allow insert if the user_id matches the authenticated user
);
