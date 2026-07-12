import { useOrderContext } from '../contexts/OrderContext';

export function useOrders() {
  const context = useOrderContext();
  return {
    orders: context.orders,
    products: context.products,
    rewards: context.rewards,
    selectedOrderForTicket: context.selectedOrderForTicket,
    setSelectedOrderForTicket: context.setSelectedOrderForTicket,
    orderCompleted: context.orderCompleted,
    updateProduct: context.updateProduct,
    updateProductReward: context.updateProductReward,
    applyPointsToCategory: context.applyPointsToCategory,
    resetOfficialRewards: context.resetOfficialRewards,
    setOrdersState: context.setOrdersState,
    setProductsState: context.setProductsState
  };
}
