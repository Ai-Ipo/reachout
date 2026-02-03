-- Migration: 007_fix_internal_id_sequence.sql
-- Fix internal_id generation to use a proper sequence table instead of COUNT(*)
-- This prevents duplicates when companies are deleted or during concurrent inserts

-- 1. Create sequence table to track next ID per city
CREATE TABLE IF NOT EXISTS public.city_sequences (
    city_id uuid PRIMARY KEY REFERENCES public.cities(id) ON DELETE CASCADE,
    next_seq integer NOT NULL DEFAULT 1
);

-- 2. Populate sequence table with current max values from existing companies
-- This finds the highest sequence number used for each city
INSERT INTO public.city_sequences (city_id, next_seq)
SELECT
    c.id as city_id,
    COALESCE(
        (
            SELECT MAX(
                CASE
                    WHEN co.internal_id ~ ('^' || c.short_code || '_[0-9]+$')
                    THEN CAST(SUBSTRING(co.internal_id FROM '_([0-9]+)$') AS integer)
                    ELSE 0
                END
            ) + 1
            FROM public.companies co
            WHERE co.city_id = c.id
        ),
        1
    ) as next_seq
FROM public.cities c
ON CONFLICT (city_id) DO UPDATE SET
    next_seq = GREATEST(city_sequences.next_seq, EXCLUDED.next_seq);

-- 3. Create function to get and increment sequence atomically
CREATE OR REPLACE FUNCTION get_next_internal_id(p_city_id uuid)
RETURNS text AS $$
DECLARE
    v_short_code text;
    v_seq integer;
BEGIN
    -- Get city short code
    SELECT short_code INTO v_short_code
    FROM public.cities
    WHERE id = p_city_id;

    IF v_short_code IS NULL THEN
        RAISE EXCEPTION 'City not found: %', p_city_id;
    END IF;

    -- Atomically get and increment the sequence
    -- Uses INSERT ... ON CONFLICT to handle race conditions
    INSERT INTO public.city_sequences (city_id, next_seq)
    VALUES (p_city_id, 2)
    ON CONFLICT (city_id) DO UPDATE
    SET next_seq = city_sequences.next_seq + 1
    RETURNING next_seq - 1 INTO v_seq;

    -- Return formatted internal_id
    RETURN v_short_code || '_' || LPAD(v_seq::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Update the trigger to use the new function
CREATE OR REPLACE FUNCTION generate_internal_id()
RETURNS trigger AS $$
BEGIN
    -- Skip if internal_id is already provided (for bulk imports with pre-generated IDs)
    IF NEW.internal_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Use the atomic sequence function
    NEW.internal_id := get_next_internal_id(NEW.city_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Enable RLS on city_sequences (admins only need access)
ALTER TABLE public.city_sequences ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write sequences (needed for the function)
CREATE POLICY "Allow sequence access for authenticated users"
ON public.city_sequences
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_next_internal_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_internal_id(uuid) TO anon;
