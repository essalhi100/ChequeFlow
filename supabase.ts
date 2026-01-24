
import { createClient } from '@supabase/supabase-js';

/**
 * DATABASE SCHEMA MIGRATION (Run this in Supabase SQL Editor):
 * 
 * -- 1. Update system_settings table
 * ALTER TABLE system_settings 
 * ADD COLUMN IF NOT EXISTS high_value_threshold NUMERIC DEFAULT 50000;
 * 
 * -- 2. Ensure the table has a unique constraint for upsert logic
 * -- ALTER TABLE system_settings ADD CONSTRAINT unique_user_settings UNIQUE (user_id);
 */

const supabaseUrl = process.env.SUPABASE_URL || 'https://eafsxriggorubqqsyezd.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ua-7c0iLf10GGsacyVZrDQ_y4zYM3Xc';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;
