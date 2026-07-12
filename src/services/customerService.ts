import { Customer } from '../types';
import { saveCustomerToSupabase } from '../lib/supabaseService';
import { saveCachedCustomer } from '../lib/indexedDB';

export const customerService = {
  async addCustomer(customer: Customer, registerSyncAction: any): Promise<void> {
    await saveCachedCustomer(customer);
    await registerSyncAction('customer_create', { customer }, async () => {
      await saveCustomerToSupabase(customer);
    });
  },

  async updateCustomer(customer: Customer, registerSyncAction: any): Promise<void> {
    await saveCachedCustomer(customer);
    await registerSyncAction('customer_update', { customer }, async () => {
      await saveCustomerToSupabase(customer);
    });
  }
};
