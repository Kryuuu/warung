import { createClient } from '@supabase/supabase-js';
import { IS_DEMO_MODE } from '../utils/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Enhanced Supabase initialization for debugging
let supabase = null;

if (!IS_DEMO_MODE) {
  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('✅ Supabase Client Initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase Client:', error);
    }
  } else {
    console.warn('⚠️ Supabase credentials missing from .env');
  }
} else {
  console.log('ℹ️ App running in Demo Mode');
}

export { supabase };
export default supabase;
