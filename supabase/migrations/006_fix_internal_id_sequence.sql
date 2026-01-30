-- Fix internal_id generation to handle concurrent/bulk inserts
-- The previous count(*) approach failed with concurrent inserts

-- Create sequence table to track last used sequence per city
CREATE TABLE IF NOT EXISTS city_sequences (
  city_id UUID PRIMARY KEY REFERENCES cities(id) ON DELETE CASCADE,
  last_seq INT DEFAULT 0
);

-- Initialize sequence table with current max sequences from existing companies
INSERT INTO city_sequences (city_id, last_seq)
SELECT
  city_id,
  COALESCE(MAX(CAST(NULLIF(SPLIT_PART(internal_id, '_', 2), '') AS INT)), 0)
FROM companies
WHERE internal_id IS NOT NULL
GROUP BY city_id
ON CONFLICT (city_id) DO UPDATE SET
  last_seq = GREATEST(city_sequences.last_seq, EXCLUDED.last_seq);

-- Update trigger function to use sequence table with proper locking
CREATE OR REPLACE FUNCTION generate_internal_id()
RETURNS trigger AS $$
DECLARE
  city_code TEXT;
  city_seq INT;
BEGIN
  -- Get city short code
  SELECT short_code INTO city_code FROM public.cities WHERE id = NEW.city_id;

  -- Get and increment sequence atomically with row lock (UPSERT)
  INSERT INTO city_sequences (city_id, last_seq)
  VALUES (NEW.city_id, 1)
  ON CONFLICT (city_id) DO UPDATE SET last_seq = city_sequences.last_seq + 1
  RETURNING last_seq INTO city_seq;

  NEW.internal_id := city_code || '_' || LPAD(city_seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
