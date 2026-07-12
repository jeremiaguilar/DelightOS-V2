const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /await Promise\.allSettled\(\[\n\s+\.\.\.newProducts\.map\(async p => \{ await saveCachedProduct\(p\); await saveProductToSupabase\(p\); \}\),\n\s+\.\.\.updatedProducts\.map\(async p => \{ await saveCachedProduct\(p\); await saveProductToSupabase\(p\); \}\)\n\s+\]\);/g,
  `const results = await Promise.allSettled([
                  ...newProducts.map(async p => { await saveCachedProduct(p); await saveProductToSupabase(p); }),
                  ...updatedProducts.map(async p => { await saveCachedProduct(p); await saveProductToSupabase(p); })
                ]);
                const errors = results.filter(r => r.status === 'rejected');
                if (errors.length > 0) {
                   console.error("Errors saving catalog:", errors);
                   throw new Error("Error al guardar productos en Supabase. Ver consola.");
                }`
);

code = code.replace(
  /await Promise\.allSettled\(\n\s+newIngredients\.map\(async i => \{ await saveCachedIngredient\(i\); await saveIngredientToSupabase\(i\); \}\)\n\s+\);/g,
  `const ingResults = await Promise.allSettled(
                  newIngredients.map(async i => { await saveCachedIngredient(i); await saveIngredientToSupabase(i); })
                );
                const ingErrors = ingResults.filter(r => r.status === 'rejected');
                if (ingErrors.length > 0) {
                   console.error("Errors saving ingredients:", ingErrors);
                   throw new Error("Error al guardar insumos en Supabase. Ver consola.");
                }`
);

fs.writeFileSync('src/App.tsx', code);
