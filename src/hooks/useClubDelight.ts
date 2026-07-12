import { useClubDelightContext } from '../contexts/ClubDelightContext';

export function useClubDelight() {
  const context = useClubDelightContext();
  return {
    customers: context.customers,
    rewards: context.rewards,
    orders: context.orders,
    addCustomer: context.addCustomer,
    updateCustomer: context.updateCustomer
  };
}
