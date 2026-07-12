import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log('Products:', { data, error });
  
  const { data: d2, error: e2 } = await supabase.from('product_prices').select('*').limit(1);
  console.log('Prices:', { d2, error: e2 });
}
test();
