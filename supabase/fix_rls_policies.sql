-- =============================================
-- FIX: Clerk + Supabase Integration
-- =============================================
-- Problem: Supabase RLS uses auth.uid() expecting UUID format,
-- but Clerk passes string IDs like 'user_38WUMzHWUP9z...'
-- 
-- Solution: Use auth.jwt() claims instead of auth.uid()
-- =============================================

-- Step 1: Drop ALL old policies that use auth.uid()
DROP POLICY IF EXISTS "Admins view all companies" ON companies;
DROP POLICY IF EXISTS "Telemarketers view assigned companies" ON companies;
DROP POLICY IF EXISTS "Admins update all companies" ON companies;
DROP POLICY IF EXISTS "Telemarketers update assigned companies" ON companies;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Cities viewable by everyone" ON cities;
DROP POLICY IF EXISTS "Admins view all directors" ON directors;
DROP POLICY IF EXISTS "Telemarketers view assigned company directors" ON directors;

-- Drop v2 policies to recreate cleanly
DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
DROP POLICY IF EXISTS "Everyone can view cities" ON cities;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
DROP POLICY IF EXISTS "Everyone can view companies" ON companies;
DROP POLICY IF EXISTS "Telemarketers can update assigned companies" ON companies;
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view directors" ON directors;

-- Step 2: Enable RLS
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE directors ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CITIES POLICIES (Simple - everyone can view)
-- =============================================
CREATE POLICY "Everyone can view cities"
ON cities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage cities"
ON cities FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'app_role') = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');

-- =============================================
-- COMPANIES POLICIES
-- =============================================
CREATE POLICY "Everyone can view companies"
ON companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage companies"
ON companies FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'app_role') = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');

-- =============================================
-- PROFILES POLICIES
-- =============================================
CREATE POLICY "Everyone can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- DIRECTORS POLICIES
-- =============================================
CREATE POLICY "Everyone can view directors"
ON directors FOR SELECT
TO authenticated
USING (true);
