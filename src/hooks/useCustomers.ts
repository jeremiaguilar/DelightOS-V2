import { useCustomerContext } from '../contexts/CustomerContext';

export function useCustomers() {
  const context = useCustomerContext();
  return {
    customers: context.customers,
    addCustomer: context.addCustomer,
    updateCustomer: context.updateCustomer,
    setCustomersState: context.setCustomersState
  };
}
