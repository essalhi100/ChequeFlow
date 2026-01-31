
import { createClient } from '@supabase/supabase-js';

// القيم الصحيحة للمشروع الخاص بك
const supabaseUrl = 'https://hbycnloggmuovsxulzuv.supabase.co';
const supabaseAnonKey = 'sb_publishable_P6sc647KZDinDYnsoZ1MtA_RdGMRSc3';

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
