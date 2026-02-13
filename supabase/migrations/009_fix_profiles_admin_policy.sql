-- Fix: Replace broken delete policy that uses auth.uid() (incompatible with Clerk)
-- with JWT-based admin management policy matching other tables

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'app_role') = 'admin')
WITH CHECK ((auth.jwt() ->> 'app_role') = 'admin');
