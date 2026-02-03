-- Update trigger to skip if internal_id is already provided
-- This allows client-side ID generation for bulk imports

CREATE OR REPLACE FUNCTION generate_internal_id()
RETURNS trigger AS $$
DECLARE
  city_code TEXT;
  city_seq INT;
BEGIN
  -- Skip if internal_id is already provided
  IF NEW.internal_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get city short code
  SELECT short_code INTO city_code FROM public.cities WHERE id = NEW.city_id;

  -- Count existing companies in this city
  SELECT COUNT(*) + 1 INTO city_seq FROM public.companies WHERE city_id = NEW.city_id;

  NEW.internal_id := city_code || '_' || LPAD(city_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
