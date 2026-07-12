import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.log("No supabase credentials");
  process.exit(0);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
