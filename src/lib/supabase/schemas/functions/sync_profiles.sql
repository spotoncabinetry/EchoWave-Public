-- Function to sync auth users to profiles
CREATE OR REPLACE FUNCTION sync_auth_users_to_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert profiles for any auth users that don't have them
    INSERT INTO public.profiles (id, email, role)
    SELECT 
        au.id,
        au.email,
        'user' as role
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL;
END;
$$;

-- Execute the sync function
SELECT sync_auth_users_to_profiles();
