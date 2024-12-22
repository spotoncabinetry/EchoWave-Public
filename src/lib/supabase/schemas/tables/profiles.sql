-- Profiles table schema
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email VARCHAR UNIQUE NOT NULL,
    phone_number VARCHAR,
    restaurant_name VARCHAR,
    address VARCHAR,
    role VARCHAR NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    business_hours JSONB,
    restaurant_id UUID REFERENCES public.restaurants(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_phone_number_idx ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS profiles_restaurant_name_idx ON public.profiles(restaurant_name);
CREATE INDEX IF NOT EXISTS profiles_restaurant_id_idx ON public.profiles(restaurant_id);

-- Add trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_timestamp ON profiles;
CREATE TRIGGER update_profile_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Function to automatically create a profile after user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email,
        role
    )
    VALUES (
        NEW.id,
        NEW.email,
        'user'  -- Default role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
