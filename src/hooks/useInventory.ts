import { useInventoryContext } from '../contexts/InventoryContext';

export function useInventory() {
  const context = useInventoryContext();
  return {
    ingredients: context.ingredients,
    addIngredient: context.addIngredient,
    updateIngredient: context.updateIngredient,
    adjustStock: context.adjustStock,
    setIngredientsState: context.setIngredientsState
  };
}
