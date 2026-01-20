-- Migration: 002_add_company_columns.sql
-- Adds missing columns for full company data capture.
-- Run this after 001_initial_schema.sql

-- Add new columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS loan_interest numeric;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS official_mail text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS representative_name text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp_status text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS response text;

-- Add remark column to directors if not exists (for per-director remarks)
ALTER TABLE public.directors ADD COLUMN IF NOT EXISTS remark text;
