
import { createClient } from '@supabase/supabase-js';

// القيم الصحيحة للمشروع الخاص بك
const supabaseUrl = 'https://eafsxriggorubqqsyezd.supabase.co';
const supabaseAnonKey = 'sb_publishable_ua-7c0iLf10GGsacyVZrDQ_y4zYM3Xc';

export const isConfigured = true;

console.log("🚀 Supabase: Initiating connection to", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  },
  global: {
    headers: { 'x-application-name': 'finansse-pro-v1' }
  }
});
