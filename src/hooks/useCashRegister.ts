import { useOrders } from './useOrders';
import { cashRegisterService } from '../services/cashRegisterService';

export function useCashRegister() {
  const { orders } = useOrders();

  const calculateCorte = (fondoInicial: number, sinceDate: string) => {
    return cashRegisterService.calculateCorteCaja(fondoInicial, orders, sinceDate);
  };

  return {
    calculateCorte
  };
}
