import { Customer, Order } from '../types';
import { saveCustomerToSupabase } from '../lib/supabaseService';
import { saveCachedCustomer } from '../lib/indexedDB';

export const clubService = {
  calculatePointsAfterOrder(customer: Customer, order: Order): Customer {
    return {
      ...customer,
      pointsAccumulated: customer.pointsAccumulated + order.pointsGenerated,
      pointsRedeemed: customer.pointsRedeemed + order.pointsUsed,
      pointsAvailable: Math.max(0, customer.pointsAvailable + order.pointsGenerated - order.pointsUsed),
      totalSpent: customer.totalSpent + (order.type === 'venta' ? order.total : 0),
      totalPurchases: customer.totalPurchases + 1,
      lastPurchaseDate: new Date().toISOString().split('T')[0]
    };
  },

  async syncCustomerPoints(customer: Customer, registerSyncAction: any): Promise<void> {
    await saveCachedCustomer(customer);
    await registerSyncAction('customer_update', { customer }, async () => {
      await saveCustomerToSupabase(customer);
    });
  }
};
