
import { createClient } from '@supabase/supabase-js';

// استخدام القيم من متغيرات البيئة أو القيم الافتراضية الموفرة
const supabaseUrl = process.env.SUPABASE_URL || 'https://eafsxriggorubqqsyezd.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ua-7c0iLf10GGsacyVZrDQ_y4zYM3Xc';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'implicit'
      },
      global: {
        headers: { 'x-application-name': 'finansse-pro' }
      }
    }) 
  : null as any;
