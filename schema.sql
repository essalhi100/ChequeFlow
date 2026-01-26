-- Run this in your Supabase SQL Editor to support the new field
ALTER TABLE checks ADD COLUMN IF NOT EXISTS fund_name TEXT;