const fs = require('fs');
let code = fs.readFileSync('src/components/CatalogImporter.tsx', 'utf8');

const recipesParseCode = `
    if (workbook.SheetNames.includes('Recetas')) {
      const sheet = workbook.Sheets['Recetas'];
      const rows = xlsx.utils.sheet_to_json<any>(sheet);
      rows.forEach((row, index) => {
        const rowNum = index + 2;
        const productName = getFieldValue(row, ['producto', 'nombre producto']);
        const ingredientName = getFieldValue(row, ['insumo', 'ingrediente']);
        const qty = Number(getFieldValue(row, ['cantidad', 'qty', 'porción']));
        
        if (!productName || !ingredientName || isNaN(qty)) {
          errors.push({ row: rowNum, msg: 'Receta inválida: Faltan datos (Producto, Insumo, Cantidad)' });
          return;
        }
        
        const pMatch = products.find(p => p.name.toLowerCase() === String(productName).toLowerCase().trim()) || existingProducts.find(p => p.name.toLowerCase() === String(productName).toLowerCase().trim());
        const iMatch = ingredients.find(i => i.name.toLowerCase() === String(ingredientName).toLowerCase().trim()) || existingIngredients.find(i => i.name.toLowerCase() === String(ingredientName).toLowerCase().trim());
        
        if (!pMatch) {
          errors.push({ row: rowNum, msg: \`Producto no encontrado para receta: \${productName}\` });
          return;
        }
        if (!iMatch) {
          errors.push({ row: rowNum, msg: \`Insumo no encontrado para receta: \${ingredientName}\` });
          return;
        }
        
        // Ensure recipe array exists
        if (!pMatch.recipe) pMatch.recipe = [];
        pMatch.recipe.push({
          ingredientId: iMatch.id,
          quantity: qty
        });
      });
    }
`;

code = code.replace(
  /setParsedProducts\(products\);/,
  recipesParseCode + "\n    setParsedProducts(products);"
);

fs.writeFileSync('src/components/CatalogImporter.tsx', code);
