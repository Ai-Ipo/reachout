-- Migration: Add 'callback' to calling_status enum
-- This must be committed before the value can be used

ALTER TYPE calling_status ADD VALUE IF NOT EXISTS 'callback';
