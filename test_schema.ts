import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log("Columns if any:", data && data.length > 0 ? Object.keys(data[0]) : "Empty, need another way to fetch columns");
}
test();
