-- Migration: Update 'picked_up' values to 'callback'
-- Run after 004_add_callback_enum.sql has been committed

UPDATE public.companies
SET calling_status = 'callback'
WHERE calling_status = 'picked_up';
