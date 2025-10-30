import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Cliente Supabase inicializado');
