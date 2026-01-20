-- Migration: 001_initial_schema.sql
-- This is a reference copy of the initial schema.
-- Run once to set up the base tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'telemarketer');
CREATE TYPE calling_status AS ENUM ('queued', 'picked_up', 'not_answered', 'not_contactable', 'interested', 'not_interested');
CREATE TYPE eligibility_status AS ENUM ('eligible', 'ineligible', 'pending');

-- 1. Cities
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  short_code text NOT NULL UNIQUE CHECK (length(short_code) = 3),
  created_at timestamptz DEFAULT now()
);

-- 2. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  role user_role DEFAULT 'telemarketer',
  full_name text,
  email text,
  clerk_id text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 3. Companies
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  internal_id text UNIQUE,
  city_id uuid NOT NULL REFERENCES public.cities(id),
  name text NOT NULL,
  financial_year text,
  turnover numeric,
  profit numeric,
  borrowed_funds numeric,
  eligibility_status eligibility_status DEFAULT 'pending',
  board_type text,
  calling_status calling_status DEFAULT 'queued',
  remarks text,
  website text,
  assigned_to uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Directors
CREATE TABLE IF NOT EXISTS public.directors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  din_no text,
  name text,
  contact_no text,
  email text,
  email_status text,
  remark text
);
