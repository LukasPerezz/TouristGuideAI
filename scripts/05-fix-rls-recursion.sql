-- Fix infinite recursion in RLS policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage cultural sites" ON cultural_sites;
DROP POLICY IF EXISTS "Admins can view all recognitions" ON user_recognitions;
DROP POLICY IF EXISTS "Admins can view all favorites" ON user_favorites;

-- Create a function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Create new non-recursive policies using the function
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));

-- Update cultural sites policies
CREATE POLICY "Admins can manage cultural sites" ON cultural_sites
    FOR ALL USING (public.is_admin(auth.uid()));

-- Update user recognitions policies  
CREATE POLICY "Admins can view all recognitions" ON user_recognitions
    FOR SELECT USING (public.is_admin(auth.uid()));

-- Update user favorites policies
CREATE POLICY "Admins can view all favorites" ON user_favorites
    FOR SELECT USING (public.is_admin(auth.uid()));
