-- Add eligible_amount column to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS eligible_amount numeric;

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
