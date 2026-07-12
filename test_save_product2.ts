import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const { data: savedProduct, error: e1 } = await supabase.from('products').upsert({
      id: "abc-123-abc",
      code: "ABC-123",
      name: "Test Product",
      category: "Bebidas",
      image_url: '',
      points_cost: 20,
      allow_reward: true,
      reward_points: 20
    }).select('id').single();
    
    console.log("Upsert result:", { savedProduct, e1 });
}
test();
