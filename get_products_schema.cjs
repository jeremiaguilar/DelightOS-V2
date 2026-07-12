const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function test() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  console.log(error || Object.keys(data[0] || {}));
}
test();
