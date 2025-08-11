-- Fix RLS policies to allow users to create and manage their own profiles

-- Drop the overly restrictive policies
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Allow users to create their own profiles
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profiles (but not change role to admin)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (role = 'user' OR public.is_admin(auth.uid()))
    );

-- Allow admins to insert any profile (for admin setup)
CREATE POLICY "Admins can insert any profile" ON user_profiles
    FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON user_profiles
    FOR UPDATE USING (public.is_admin(auth.uid()));
