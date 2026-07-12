const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /throw new Error\("Error al guardar insumos en Supabase\. Ver consola\."\);\n\s+\}/,
  `throw new Error("Error al guardar insumos en Supabase. Ver consola.");
                }
                
                // Recargar desde Supabase para verificar que se guardó correctamente
                const { loadProductsFromSupabase } = await import('./lib/supabaseService');
                const reloadedProducts = await loadProductsFromSupabase([]);
                if (reloadedProducts.length > 0) {
                   setProductsState(reloadedProducts);
                   for (const rp of reloadedProducts) {
                     await saveCachedProduct(rp);
                   }
                }`
);

fs.writeFileSync('src/App.tsx', code);
