import React, { createContext, useContext } from 'react';
import { Ingredient } from '../types';
import { useSystemContext } from './SystemContext';
import { saveCachedIngredient } from '../lib/indexedDB';
import { inventoryService } from '../services/inventoryService';

interface InventoryContextType {
  ingredients: Ingredient[];
  addIngredient: (newIng: Ingredient) => Promise<void>;
  updateIngredient: (updatedIng: Ingredient) => Promise<void>;
  adjustStock: (ingredientId: string, amount: number) => Promise<void>;
  setIngredientsState: React.Dispatch<React.SetStateAction<Ingredient[]>>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ingredients, setIngredients, addAuditLog, registerSyncAction } = useSystemContext();

  const addIngredient = async (newIng: Ingredient) => {
    const updated = [...ingredients, newIng];
    setIngredients(updated);
    
    await addAuditLog(
      'Registrar Insumo',
      'N/A',
      `${newIng.name} (Stock: ${newIng.stock} ${newIng.unit})`,
      'Inventario'
    );

    await inventoryService.addIngredient(newIng, registerSyncAction);
  };

  const updateIngredient = async (updatedIng: Ingredient) => {
    const prevIng = ingredients.find(i => i.id === updatedIng.id);
    const prevDetails = prevIng ? `${prevIng.name} (Stock: ${prevIng.stock} ${prevIng.unit})` : 'N/D';
    
    const updated = ingredients.map(i => i.id === updatedIng.id ? updatedIng : i);
    setIngredients(updated);
    
    await addAuditLog(
      'Editar Insumo',
      prevDetails,
      `${updatedIng.name} (Stock: ${updatedIng.stock} ${updatedIng.unit})`,
      'Inventario'
    );

    await inventoryService.updateIngredient(updatedIng, registerSyncAction);
  };

  const adjustStock = async (ingredientId: string, amount: number) => {
    const prevIng = ingredients.find(i => i.id === ingredientId);
    const prevStock = prevIng ? prevIng.stock : 0;
    
    const updated = ingredients.map(i => {
      if (i.id === ingredientId) {
        return { ...i, stock: Math.max(0, i.stock + amount) };
      }
      return i;
    });
    setIngredients(updated);
    
    const targetIng = updated.find(i => i.id === ingredientId);
    if (targetIng) {
      await saveCachedIngredient(targetIng);
    }
    
    await addAuditLog(
      'Ajustar Stock',
      `Stock previo: ${prevStock} ${prevIng?.unit || ''}`,
      `Ajuste: ${amount > 0 ? '+' : ''}${amount} (Nuevo stock: ${Math.max(0, prevStock + amount)})`,
      'Inventario'
    );

    await inventoryService.adjustStock(ingredientId, amount, prevStock, prevIng?.unit || '', registerSyncAction);
  };

  return (
    <InventoryContext.Provider value={{ ingredients, addIngredient, updateIngredient, adjustStock, setIngredientsState: setIngredients }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventoryContext must be used within an InventoryProvider');
  return context;
};
