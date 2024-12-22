-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;

-- Function to promote a user to admin (only callable by existing admins)
CREATE OR REPLACE FUNCTION promote_to_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only administrators can promote users to admin role';
    END IF;

    -- Update the user's role to admin
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = target_user_id;
END;
$$;

-- Function to demote an admin to user (only callable by existing admins)
CREATE OR REPLACE FUNCTION demote_to_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the calling user is an admin
    IF NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Only administrators can demote admin users';
    END IF;

    -- Prevent demoting the last admin
    IF (
        SELECT COUNT(*)
        FROM public.profiles
        WHERE role = 'admin'
    ) <= 1 AND target_user_id = (
        SELECT id
        FROM public.profiles
        WHERE role = 'admin'
        LIMIT 1
    ) THEN
        RAISE EXCEPTION 'Cannot demote the last administrator';
    END IF;

    -- Update the user's role to user
    UPDATE public.profiles
    SET role = 'user'
    WHERE id = target_user_id;
END;
$$;
