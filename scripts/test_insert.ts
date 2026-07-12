import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const { data, error } = await supabase.from('products').insert({
    code: 'TEST-123',
    name: 'Test',
    category: 'Test',
    active: true,
    is_available_today: true,
    promotion_text: 'none'
  }).select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
