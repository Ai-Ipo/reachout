-- Allow telemarketers to update companies assigned to them
-- Uses auth.jwt() sub claim (Clerk user ID) matched against profiles.clerk_id -> assigned_to

CREATE POLICY "Telemarketers can update assigned companies"
ON public.companies FOR UPDATE
TO authenticated
USING (
    (auth.jwt() ->> 'app_role') = 'telemarketer'
    AND assigned_to IN (
        SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
)
WITH CHECK (
    (auth.jwt() ->> 'app_role') = 'telemarketer'
    AND assigned_to IN (
        SELECT id FROM public.profiles WHERE clerk_id = auth.jwt() ->> 'sub'
    )
);
