import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if configured
const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
