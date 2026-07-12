import { Ingredient } from '../types';

export const productionService = {
  calculateSushiRiceAvailable(ingredients: Ingredient[]): number {
    const riceIng = ingredients.find(i => i.id === 'ing-1');
    return riceIng ? riceIng.stock : 0;
  },

  calculateMakisPossible(ingredients: Ingredient[]): number {
    const riceIng = ingredients.find(i => i.id === 'ing-1');
    const cupIng = ingredients.find(i => i.id === 'ing-10');
    const lidIng = ingredients.find(i => i.id === 'ing-11');
    const maxMakisByRice = riceIng ? Math.floor(riceIng.stock / 150) : 0;
    return Math.min(
      maxMakisByRice,
      cupIng ? cupIng.stock : 0,
      lidIng ? lidIng.stock : 0
    );
  }
};
