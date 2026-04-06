import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsblpybcfyszisdpfrzl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zwqNreka5EvvT89tOMbSsA_wOtiQ-J3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const generateNumericUserId = (uuid: string): number => {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 90000) + 10000; // 5 digits
};

export const generate12DigitId = (): number => {
  return Math.floor(Math.random() * 900000000000) + 100000000000; // 12 digits
};
