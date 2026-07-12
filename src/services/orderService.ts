import { Order, KdsStatus } from '../types';
import { saveOrderToSupabase, updateOrderStatusInSupabase } from '../lib/supabaseService';
import { saveCachedOrder } from '../lib/indexedDB';

export const orderService = {
  async completeOrder(order: Order, cashierProfileId: string, registerSyncAction: any): Promise<void> {
    await saveCachedOrder(order);
    await registerSyncAction(
      order.type === 'canje' ? 'canje' : 'sale',
      { order, cashierProfileId },
      async () => {
        await saveOrderToSupabase(order, cashierProfileId);
      }
    );
  },

  async updateOrderStatus(orderId: string, status: KdsStatus, registerSyncAction: any): Promise<void> {
    await registerSyncAction('order_status_update', { orderId, status }, async () => {
      await updateOrderStatusInSupabase(orderId, status);
    });
  }
};
