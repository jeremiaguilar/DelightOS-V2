import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const product = {
      id: "abc-123-abc",
      name: "Test Product",
      category: "Bebidas",
      prices: {
        "MOSTRADOR": 50,
        "UBER": 60,
        "DIDI": 60,
        "ESPECIAL": 40,
        "ONLINE_FUTURE": 50
      }
  };
  
  const { data: savedProduct, error: e1 } = await supabase.from('products').upsert({
      id: product.id,
      code: product.id.substring(0, 8).toUpperCase(),
      name: product.name,
      category: product.category,
      image_url: '',
      points_cost: 20,
      allow_reward: true,
      reward_points: 20,
      active: true,
      is_available_today: true,
      promotion_text: null,
      main_category: null,
      sub_category: null,
      family: null
    }).select('id').single();
    
    console.log("Upsert result:", { savedProduct, e1 });
}
test();
