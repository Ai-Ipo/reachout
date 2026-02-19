-- Fix: treat null app_role as telemarketer.
-- Admins and superadmins always have their role set explicitly in Clerk public metadata,
-- so null only occurs for regular users who were created before role assignment was enforced.

DROP POLICY IF EXISTS "Telemarketers can update assigned companies" ON public.companies;

CREATE POLICY "Telemarketers can update assigned companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
    COALESCE(auth.jwt() ->> 'app_role', 'telemarketer') = 'telemarketer'
    AND assigned_to IN (
        SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
)
WITH CHECK (
    COALESCE(auth.jwt() ->> 'app_role', 'telemarketer') = 'telemarketer'
    AND assigned_to IN (
        SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
);
