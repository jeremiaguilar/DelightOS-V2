import { useKDSContext } from '../contexts/KDSContext';

export function useKDS() {
  const context = useKDSContext();
  return {
    orders: context.orders,
    updateOrderStatus: context.updateOrderStatus,
    activeKdsCount: context.activeKdsCount
  };
}
