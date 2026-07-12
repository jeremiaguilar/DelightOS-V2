const fs = require('fs');
let code = fs.readFileSync('src/lib/supabaseService.ts', 'utf8');

// Fix saveProductToSupabase error handling
code = code.replace(
  /const { data: savedProduct } = await supabase\.from\('products'\)\.upsert\(\{(.*?)\}\)\.select\('id'\)\.single\(\);/s,
  `const { data: savedProduct, error: productErr } = await supabase.from('products').upsert({$1}).select('id').single();
    if (productErr) { console.error('Supabase product insert error:', productErr); throw productErr; }`
);

// Fix product_prices error handling
code = code.replace(
  /await supabase\.from\('product_prices'\)\.upsert\(payload, \{\n\s+onConflict: 'product_id,sales_channel,branch_id'\n\s+\}\);/g,
  `const { error: priceErr } = await supabase.from('product_prices').upsert(payload, {
        onConflict: 'product_id,sales_channel,branch_id'
      });
      if (priceErr) { console.error('Supabase price insert error:', priceErr); throw priceErr; }`
);

// Fix saveIngredientToSupabase error handling
code = code.replace(
  /const { data: savedIngredient } = await supabase\.from\('ingredients'\)\.upsert\(\{(.*?)\}\)\.select\('id'\)\.single\(\);/s,
  `const { data: savedIngredient, error: ingErr } = await supabase.from('ingredients').upsert({$1}).select('id').single();
    if (ingErr) { console.error('Supabase ingredient insert error:', ingErr); throw ingErr; }`
);

// Fix saveOrderToSupabase error handling
code = code.replace(
  /const { data: savedOrder } = await supabase\.from\('orders'\)\.insert\(\{(.*?)\}\)\.select\('id'\)\.single\(\);/s,
  `const { data: savedOrder, error: orderErr } = await supabase.from('orders').insert({$1}).select('id').single();
    if (orderErr) { console.error('Supabase order insert error:', orderErr); throw orderErr; }`
);

// Fix order_items error handling
code = code.replace(
  /await supabase\.from\('order_items'\)\.insert\(itemPayloads\);/s,
  `const { error: itemsErr } = await supabase.from('order_items').insert(itemPayloads);
      if (itemsErr) { console.error('Supabase order_items insert error:', itemsErr); throw itemsErr; }`
);

fs.writeFileSync('src/lib/supabaseService.ts', code);
