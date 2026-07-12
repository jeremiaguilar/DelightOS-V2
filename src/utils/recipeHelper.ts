import { Ingredient, Product } from '../types';

export interface ProductionReport {
  maxMakisByRice: number;
  maxFrappesByCups: number;
  productAvailability: Record<string, number>; // productId -> quantity can prepare
  lowStockIngredients: Ingredient[];
  outOfStockProducts: Product[];
  limitingIngredients: Record<string, string>; // productId -> limiting ingredient name
  insumosCriticos: { ingredientName: string; stock: number; unit: string; minStock: number }[];
  recommendations: string[];
}

export function calculateProductionMetrics(
  ingredients: Ingredient[],
  products: Product[]
): ProductionReport {
  const productAvailability: Record<string, number> = {};
  const limitingIngredients: Record<string, string> = {};
  
  // Find Rice and Cup ingredients
  const riceIng = ingredients.find(i => i.id === 'ing-1');
  const cupIng = ingredients.find(i => i.id === 'ing-10');
  const lidIng = ingredients.find(i => i.id === 'ing-11');

  const maxMakisByRice = riceIng ? Math.floor(riceIng.stock / 150) : 0;
  const maxFrappesByCups = Math.min(
    cupIng ? cupIng.stock : 0,
    lidIng ? lidIng.stock : 0
  );

  const activeProducts = products.filter(p => p.active);

  activeProducts.forEach(prod => {
    if (!prod.recipe || prod.recipe.length === 0) {
      productAvailability[prod.id] = 999; // unlimited if no recipe
      return;
    }

    let minAvail = Infinity;
    let limitIngName = 'Ninguno';

    prod.recipe.forEach(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (!ing) {
        minAvail = 0;
        limitIngName = 'Ingrediente faltante';
        return;
      }
      const avail = Math.floor(ing.stock / item.quantity);
      if (avail < minAvail) {
        minAvail = avail;
        limitIngName = ing.name;
      }
    });

    productAvailability[prod.id] = minAvail === Infinity ? 0 : minAvail;
    limitingIngredients[prod.id] = limitIngName;
  });

  const lowStockIngredients = ingredients.filter(i => i.active && i.stock <= i.minStock);
  const outOfStockProducts = activeProducts.filter(p => productAvailability[p.id] === 0);

  const insumosCriticos = lowStockIngredients.map(i => ({
    ingredientName: i.name,
    stock: i.stock,
    unit: i.unit,
    minStock: i.minStock
  }));

  // Smart Recommendations
  const recommendations: string[] = [];
  if (riceIng && riceIng.stock > 1000) {
    recommendations.push(`Con el arroz actual puedes preparar aproximadamente ${maxMakisByRice} makis.`);
  } else {
    recommendations.push('⚠️ ALERTA: Arroz de sushi críticamente bajo. ¡Peligro de detener producción de Makis!');
  }

  if (cupIng && cupIng.stock > 10) {
    recommendations.push(`Cuentas con vasos suficientes para preparar alrededor de ${maxFrappesByCups} bebidas frías (Frappés/Smoothies).`);
  } else {
    recommendations.push('⚠️ ALERTA: Vasos agotados o próximos a agotarse. Detendrá venta de frappés.');
  }

  // Suggest products to promote based on high availability and profitability
  const highStockProducts = activeProducts
    .filter(p => productAvailability[p.id] > 10)
    .sort((a, b) => productAvailability[b.id] - productAvailability[a.id])
    .slice(0, 3);

  if (highStockProducts.length > 0) {
    recommendations.push(
      `Sugerencia de Producción: Promociona ${highStockProducts.map(p => `"${p.name}"`).join(', ')}, ya que cuentas con insumos de sobra (${highStockProducts.map(p => `${productAvailability[p.id]} disp.`).join(', ')}).`
    );
  }

  // Warning about limiters
  const criticalLimiters = new Set<string>();
  activeProducts.forEach(p => {
    if (productAvailability[p.id] < 5 && limitingIngredients[p.id] !== 'Ninguno') {
      criticalLimiters.add(limitingIngredients[p.id]);
    }
  });

  if (criticalLimiters.size > 0) {
    recommendations.push(
      `Abastecimiento Crítico: Adquirir ${Array.from(criticalLimiters).slice(0, 3).join(', ')} para reactivar la disponibilidad de tus productos principales.`
    );
  }

  return {
    maxMakisByRice,
    maxFrappesByCups,
    productAvailability,
    lowStockIngredients,
    outOfStockProducts,
    limitingIngredients,
    insumosCriticos,
    recommendations
  };
}
