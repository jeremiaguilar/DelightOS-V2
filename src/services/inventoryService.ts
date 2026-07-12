import { Ingredient, Order, Product } from '../types';
import { saveIngredientToSupabase, recordInventoryMovement } from '../lib/supabaseService';
import { saveCachedIngredient } from '../lib/indexedDB';

export const inventoryService = {
  async addIngredient(ingredient: Ingredient, registerSyncAction: any): Promise<void> {
    await saveCachedIngredient(ingredient);
    await registerSyncAction('ingredient_create', { ingredient }, async () => {
      await saveIngredientToSupabase(ingredient);
    });
  },

  async updateIngredient(ingredient: Ingredient, registerSyncAction: any): Promise<void> {
    await saveCachedIngredient(ingredient);
    await registerSyncAction('ingredient_update', { ingredient }, async () => {
      await saveIngredientToSupabase(ingredient);
    });
  },

  async adjustStock(ingredientId: string, amount: number, prevStock: number, unit: string, registerSyncAction: any): Promise<void> {
    await registerSyncAction('inventory_movement', {
      ingredientId,
      type: 'ajuste',
      quantity: amount,
      notes: `Ajuste manual de inventario: ${amount > 0 ? '+' : ''}${amount}`
    }, async () => {
      await recordInventoryMovement(
        ingredientId,
        'ajuste',
        amount,
        `Ajuste manual de inventario: ${amount > 0 ? '+' : ''}${amount}`
      );
    });
  },

  async deductRecipeIngredients(
    order: Order,
    ingredients: Ingredient[],
    products: Product[],
    registerSyncAction: any,
    addAuditLog: any
  ): Promise<Ingredient[]> {
    const latestIngredients = [...ingredients];
    for (const cartItem of order.items) {
      const catalogProduct = products.find(p => p.id === cartItem.productId);
      if (catalogProduct && catalogProduct.recipe) {
        for (const recipeItem of catalogProduct.recipe) {
          const idx = latestIngredients.findIndex(i => i.id === recipeItem.ingredientId);
          if (idx > -1) {
            const prevIng = latestIngredients[idx];
            const consumed = recipeItem.quantity * cartItem.quantity;
            const updatedIng = {
              ...prevIng,
              stock: Math.max(0, prevIng.stock - consumed)
            };
            latestIngredients[idx] = updatedIng;
            
            await addAuditLog(
              'Deducción Receta',
              `Stock previo: ${prevIng.stock} ${prevIng.unit}`,
              `Consumo por pedido ${order.ticketNumber}: -${consumed} ${prevIng.unit} (Producto: ${cartItem.name})`,
              'Inventario'
            );

            await saveCachedIngredient(updatedIng);

            await registerSyncAction('inventory_movement', {
              ingredientId: recipeItem.ingredientId,
              type: order.type === 'canje' ? 'canje' : 'venta',
              quantity: -consumed,
              notes: `Consumo automático por pedido ${order.ticketNumber}`,
              orderId: order.id
            }, async () => {
              await recordInventoryMovement(
                recipeItem.ingredientId,
                order.type === 'canje' ? 'canje' : 'venta',
                -consumed,
                `Consumo automático por pedido ${order.ticketNumber}`,
                order.id
              );
            });
          }
        }
      }
    }
    return latestIngredients;
  }
};
