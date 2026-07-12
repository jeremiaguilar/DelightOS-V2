import { Order } from '../types';

export const reportService = {
  calculateAverageTicket(orders: Order[]): number {
    const validOrders = orders.filter(o => o.status !== 'cancelado');
    if (validOrders.length === 0) return 0;
    const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);
    return totalSales / validOrders.length;
  }
};
