import React, { createContext, useContext, useMemo, useState } from 'react';
import { Order, Product, Reward, ProductCategory } from '../types';
import { saveProductToSupabase, saveOrderToSupabase } from '../lib/supabaseService';
import { saveCachedProduct, saveCachedOrder } from '../lib/indexedDB';
import { useSystemContext } from './SystemContext';
import { enrichProductsWithRewards, getProductRewardConfigs, saveProductRewardConfigs, getDefaultRewardPointsForProduct } from '../App';
import { orderService } from '../services/orderService';
import { inventoryService } from '../services/inventoryService';
import { clubService } from '../services/clubService';

interface OrderContextType {
  orders: Order[];
  products: Product[];
  rewards: Reward[];
  selectedOrderForTicket: Order | null;
  setSelectedOrderForTicket: React.Dispatch<React.SetStateAction<Order | null>>;
  orderCompleted: (newOrder: Order, currentUser: any, customers: any, setCustomers: any) => Promise<void>;
  updateProduct: (updatedProduct: Product) => Promise<void>;
  updateProductReward: (productId: string, allowReward: boolean, rewardPoints: number) => Promise<void>;
  applyPointsToCategory: (category: ProductCategory, points: number) => Promise<void>;
  resetOfficialRewards: () => Promise<void>;
  setOrdersState: React.Dispatch<React.SetStateAction<Order[]>>;
  setProductsState: React.Dispatch<React.SetStateAction<Product[]>>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    orders,
    setOrders,
    products,
    setProducts,
    ingredients,
    setIngredients,
    addAuditLog,
    registerSyncAction
  } = useSystemContext();

  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<Order | null>(null);

  const rewards = useMemo<Reward[]>(() => {
    return products
      .filter(p => p.active !== false && p.allowReward !== false)
      .map(p => ({
        id: p.id,
        name: p.name,
        points: p.rewardPoints ?? getDefaultRewardPointsForProduct(p),
        category: p.category,
        active: true
      }));
  }, [products]);

  const orderCompleted = async (newOrder: Order, currentUser: any, customers: any, setCustomers: any) => {
    // Ensure Supabase succeeds before updating any local state
    await saveOrderToSupabase(newOrder, currentUser?.id || '');

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    
    // Actually we should saveCachedOrder inside orderService.ts which we did.

    const nextIngredients = await inventoryService.deductRecipeIngredients(
      newOrder,
      ingredients,
      products,
      registerSyncAction,
      addAuditLog
    );
    setIngredients(nextIngredients);

    if (newOrder.type === 'canje') {
      await addAuditLog(
        'Canje de Puntos',
        `Cliente ${newOrder.customerId} - Puntos previos calculados`,
        `Canje Ticket ${newOrder.ticketNumber}: ${newOrder.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} (Pts canjeados: -${newOrder.pointsUsed})`,
        'Punto de Venta'
      );
    } else {
      await addAuditLog(
        'Registrar Venta',
        'N/A',
        `Venta Ticket ${newOrder.ticketNumber} (${newOrder.channel}): Total $${newOrder.total.toFixed(2)} (Pts generados: +${newOrder.pointsGenerated})`,
        'Punto de Venta'
      );
    }

    if (newOrder.customerId) {
      const cust = customers.find((c: any) => c.id === newOrder.customerId);
      if (cust) {
        const updatedCust = clubService.calculatePointsAfterOrder(cust, newOrder);
        const updatedCustomers = customers.map((c: any) => c.id === updatedCust.id ? updatedCust : c);
        setCustomers(updatedCustomers);
        await clubService.syncCustomerPoints(updatedCust, registerSyncAction);
      }
    }

    setSelectedOrderForTicket(newOrder);

    
    await saveCachedOrder(newOrder);
  };

  const updateProduct = async (updatedProduct: Product) => {
    const prevProd = products.find(p => p.id === updatedProduct.id);
    const prevPriceText = prevProd ? `Mostrador: $${prevProd.prices.MOSTRADOR}, Uber: $${prevProd.prices.UBER}, DiDi: $${prevProd.prices.DIDI}` : 'N/D';
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    await saveCachedProduct(updatedProduct);
    
    await addAuditLog(
      'Modificar Producto',
      prevPriceText,
      `Mostrador: $${updatedProduct.prices.MOSTRADOR}, Uber: $${updatedProduct.prices.UBER}, DiDi: $${updatedProduct.prices.DIDI}`,
      'Catálogo'
    );
    
    await registerSyncAction('product_update', { product: updatedProduct }, async () => {
      await saveProductToSupabase(updatedProduct);
    });
  };

  const updateProductReward = async (productId: string, allowReward: boolean, rewardPoints: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const prevAllow = prod.allowReward !== false;
    const prevPoints = prod.rewardPoints ?? getDefaultRewardPointsForProduct(prod);

    const configs = getProductRewardConfigs();
    configs[productId] = { allowReward, rewardPoints };
    saveProductRewardConfigs(configs);

    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return { ...p, allowReward, rewardPoints };
      }
      return p;
    });
    setProducts(updatedProducts);

    const updatedProd = updatedProducts.find(p => p.id === productId)!;
    await saveCachedProduct(updatedProd);

    await addAuditLog(
      'Configurar Canje Producto',
      `Permitir: ${prevAllow ? 'SÍ' : 'NO'}, Puntos: ${prevPoints}`,
      `Permitir: ${allowReward ? 'SÍ' : 'NO'}, Puntos: ${rewardPoints}`,
      `Catálogo: ${prod.name}`
    );
  };

  const applyPointsToCategory = async (category: ProductCategory, points: number) => {
    const configs = getProductRewardConfigs();
    
    const updatedProducts = products.map(p => {
      if (p.category === category) {
        configs[p.id] = { allowReward: true, rewardPoints: points };
        return { ...p, allowReward: true, rewardPoints: points };
      }
      return p;
    });

    saveProductRewardConfigs(configs);
    setProducts(updatedProducts);

    for (const p of updatedProducts) {
      if (p.category === category) {
        await saveCachedProduct(p);
      }
    }

    await addAuditLog(
      'Configurar Canje Categoría',
      `Varios productos de la categoría: ${category}`,
      `Puntos aplicados: ${points} pts`,
      `Catálogo`
    );
  };

  const resetOfficialRewards = async () => {
    const configs = getProductRewardConfigs();
    
    const updatedProducts = products.map(p => {
      const points = getDefaultRewardPointsForProduct(p);
      configs[p.id] = { allowReward: true, rewardPoints: points };
      return { ...p, allowReward: true, rewardPoints: points };
    });

    saveProductRewardConfigs(configs);
    setProducts(updatedProducts);

    for (const p of updatedProducts) {
      await saveCachedProduct(p);
    }

    await addAuditLog(
      'Restablecer Canje Oficial',
      'Valores personalizados',
      'Valores oficiales aplicados a todos los productos',
      'Catálogo'
    );
  };

  return (
    <OrderContext.Provider value={{
      orders,
      products,
      rewards,
      selectedOrderForTicket,
      setSelectedOrderForTicket,
      orderCompleted,
      updateProduct,
      updateProductReward,
      applyPointsToCategory,
      resetOfficialRewards,
      setOrdersState: setOrders,
      setProductsState: setProducts
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrderContext must be used within a OrderProvider');
  return context;
};
