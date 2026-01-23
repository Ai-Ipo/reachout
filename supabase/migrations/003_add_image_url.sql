-- Add image_url column to profiles for storing Clerk profile pictures
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image_url text;
