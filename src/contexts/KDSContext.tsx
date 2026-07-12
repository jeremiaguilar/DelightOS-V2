import React, { createContext, useContext, useMemo } from 'react';
import { Order, KdsStatus } from '../types';
import { useSystemContext } from './SystemContext';
import { orderService } from '../services/orderService';
import { saveCachedOrder } from '../lib/indexedDB';

interface KDSContextType {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: KdsStatus) => Promise<void>;
  activeKdsCount: number;
}

const KDSContext = createContext<KDSContextType | undefined>(undefined);

export const KDSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { orders, setOrders, registerSyncAction } = useSystemContext();

  const updateOrderStatus = async (orderId: string, status: KdsStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    
    const targetOrder = updated.find(o => o.id === orderId);
    if (targetOrder) {
      await saveCachedOrder(targetOrder);
    }

    await orderService.updateOrderStatus(orderId, status, registerSyncAction);
  };

  const activeKdsCount = useMemo(() => {
    return orders.filter(o => o.status === 'pendiente' || o.status === 'preparacion').length;
  }, [orders]);

  return (
    <KDSContext.Provider value={{
      orders,
      updateOrderStatus,
      activeKdsCount
    }}>
      {children}
    </KDSContext.Provider>
  );
};

export const useKDSContext = () => {
  const context = useContext(KDSContext);
  if (!context) throw new Error('useKDSContext must be used within a KDSProvider');
  return context;
};
