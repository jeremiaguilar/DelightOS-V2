import { useInventory } from './useInventory';
import { productionService } from '../services/productionService';

export function useProduction() {
  const { ingredients } = useInventory();

  const getSushiRiceAvailable = () => {
    return productionService.calculateSushiRiceAvailable(ingredients);
  };

  const getMakisPossible = () => {
    return productionService.calculateMakisPossible(ingredients);
  };

  return {
    getSushiRiceAvailable,
    getMakisPossible
  };
}
