import { Order } from '../types';

export const cashRegisterService = {
  calculateCorteCaja(fondoInicial: number, orders: Order[], sinceDate: string): { totalEfectivo: number; expectedTotal: number } {
    const cutOrders = orders.filter(o => new Date(o.createdAt).getTime() >= new Date(sinceDate).getTime());
    const vEfectivo = cutOrders
      .filter(o => o.paymentMethod === 'efectivo' && o.status !== 'cancelado')
      .reduce((sum, o) => sum + o.total, 0);
    return {
      totalEfectivo: vEfectivo,
      expectedTotal: fondoInicial + vEfectivo
    };
  }
};
