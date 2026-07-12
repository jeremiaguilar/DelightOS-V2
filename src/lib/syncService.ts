/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';
import { DEFAULT_BRANCH_ID } from './supabaseService';
import { 
  saveCustomerToSupabase, 
  saveOrderToSupabase, 
  updateOrderStatusInSupabase, 
  saveIngredientToSupabase, 
  recordInventoryMovement, 
  saveProductToSupabase, 
  saveAuditLogToSupabase 
} from './supabaseService';
import { 
  PendingSyncItem, 
  getPendingSync, 
  removeFromPendingSync, 
  updatePendingSync 
} from './indexedDB';

/**
 * Synchronizes a single pending operation from the queue.
 * Detects conflicts and returns success or conflict information.
 */
export async function syncSingleItem(item: PendingSyncItem): Promise<{ success: boolean; conflict?: string }> {
  if (!supabase) {
    return { success: false, conflict: 'Supabase no está configurado o inicializado' };
  }

  try {
    switch (item.type) {
      case 'sale':
      case 'canje': {
        const { order, cashierProfileId } = item.payload;
        
        // Conflict Check: Check if order already exists in Supabase
        const { data: existingOrder, error: checkError } = await supabase
          .from('orders')
          .select('id, total, folio')
          .eq('id', order.id)
          .maybeSingle();

        if (checkError) {
          return { success: false };
        }

        if (existingOrder) {
          // If the order exists and has a different total or ticket number, it's a conflict
          if (Number(existingOrder.total) !== Number(order.total) || existingOrder.folio !== order.ticketNumber) {
            return { 
              success: false, 
              conflict: `La venta con ID ${order.id} ya existe en el servidor con datos distintos (Total servidor: $${existingOrder.total} vs Local: $${order.total}).` 
            };
          }
          // If exactly identical, consider synced
          return { success: true };
        }

        // Also check if the folio (ticketNumber) is already used by a different order ID
        const { data: folioOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('folio', order.ticketNumber)
          .eq('branch_id', DEFAULT_BRANCH_ID)
          .maybeSingle();

        if (folioOrder && folioOrder.id !== order.id) {
          return {
            success: false,
            conflict: `Conflicto de Folio: El número de ticket ${order.ticketNumber} ya fue utilizado por otra orden en el servidor (ID: ${folioOrder.id}).`
          };
        }

        // Save order
        await saveOrderToSupabase(order, cashierProfileId);
        return { success: true };
      }

      case 'customer_create':
      case 'customer_update': {
        const { customer } = item.payload;
        const cleanId = customer.id.replace('DL-', '');
        const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
        
        let existingCustomer = null;
        if (isRealUUID) {
          const { data } = await supabase.from('customers').select('*').eq('id', cleanId).maybeSingle();
          existingCustomer = data;
        } else {
          const { data } = await supabase.from('customers').select('*').eq('qr_code', customer.qrCode || customer.id).maybeSingle();
          existingCustomer = data;
        }

        if (existingCustomer) {
          // Check if server points or total spent has been modified in a way that causes conflict
          // If server points are different from what our local customer had before the update (or current), we detect conflict.
          // Let's check if the points match. If they differ by more than what we modified, there's a conflict.
          const serverPoints = Number(existingCustomer.points) || 0;
          const serverSpent = Number(existingCustomer.total_spent) || 0;

          // If the server data is more recent or has different points (e.g., edited elsewhere), raise a conflict
          // so we don't accidentally wipe out points earned on another terminal.
          if (serverPoints !== customer.pointsAvailable && Math.abs(serverPoints - customer.pointsAvailable) > 200) {
            return {
              success: false,
              conflict: `Conflicto de Cliente: El socio ${customer.name} tiene puntos distintos en el servidor (${serverPoints} pts) comparado con la actualización local (${customer.pointsAvailable} pts).`
            };
          }
        }

        await saveCustomerToSupabase(customer);
        return { success: true };
      }

      case 'inventory_movement': {
        const { ingredientId, type, quantity, notes, orderId } = item.payload;
        
        // Inventory movements are append-only. No conflict usually, but we check if ingredient exists
        const { data: ing } = await supabase.from('ingredients').select('id').eq('id', ingredientId).maybeSingle();
        if (!ing) {
          return { success: false, conflict: `El ingrediente con ID ${ingredientId} no existe en el servidor.` };
        }

        await recordInventoryMovement(ingredientId, type, quantity, notes, orderId);
        return { success: true };
      }

      case 'ingredient_create':
      case 'ingredient_update': {
        const { ingredient } = item.payload;
        
        // Conflict Check: check if modified concurrently
        const { data: existingIng } = await supabase.from('ingredients').select('current_stock').eq('id', ingredient.id).maybeSingle();
        if (existingIng) {
          const serverStock = Number(existingIng.current_stock) || 0;
          // If stock differs significantly and we might overwrite server state, flag it
          if (serverStock !== ingredient.stock && Math.abs(serverStock - ingredient.stock) > 50) {
            return {
              success: false,
              conflict: `Conflicto de Inventario: El ingrediente ${ingredient.name} tiene un stock diferente en el servidor (${serverStock} g/ml/pz) comparado con el valor local (${ingredient.stock}).`
            };
          }
        }

        await saveIngredientToSupabase(ingredient);
        return { success: true };
      }

      case 'product_update': {
        const { product } = item.payload;
        await saveProductToSupabase(product);
        return { success: true };
      }

      case 'order_status_update': {
        const { orderId, status } = item.payload;
        
        // Conflict Check: Check current status in server
        const { data: serverOrder } = await supabase.from('orders').select('status').eq('id', orderId).maybeSingle();
        if (serverOrder) {
          const dbStatus = status === 'pendiente' ? 'pending' : status === 'preparacion' ? 'preparing' : 'completed';
          if (serverOrder.status === 'completed' && dbStatus !== 'completed') {
            return {
              success: false,
              conflict: `Conflicto de Cocina: El pedido ${orderId} ya está completado en el servidor, no se puede regresar a un estado anterior.`
            };
          }
        }

        await updateOrderStatusInSupabase(orderId, status);
        return { success: true };
      }

      case 'audit_log': {
        const { log, userId, ipAddress } = item.payload;
        await saveAuditLogToSupabase(log, userId, ipAddress);
        return { success: true };
      }

      default:
        return { success: true };
    }
  } catch (error: any) {
    console.error('Error syncing single item:', error);
    return { success: false };
  }
}

/**
 * Processes the entire pending sync queue.
 * Updates item statuses or deletes them upon success.
 * Returns true if all items processed successfully, false if some failed or had conflicts.
 */
export async function syncPendingQueue(
  onStatusChange?: (status: 'syncing' | 'synced' | 'error' | 'idle') => void
): Promise<boolean> {
  const queue = await getPendingSync();
  if (queue.length === 0) {
    if (onStatusChange) onStatusChange('idle');
    return true;
  }

  if (onStatusChange) onStatusChange('syncing');
  let hasErrorsOrConflicts = false;

  for (const item of queue) {
    // We only try to sync pending items, skip review required ones (or we can retry them if user resolved them, but by default skip)
    if (item.status === 'review_required') {
      hasErrorsOrConflicts = true;
      continue;
    }

    const result = await syncSingleItem(item);

    if (result.success) {
      if (item.id !== undefined) {
        await removeFromPendingSync(item.id);
      }
    } else if (result.conflict) {
      // Mark as requiring review
      item.status = 'review_required';
      item.conflictReason = result.conflict;
      await updatePendingSync(item);
      hasErrorsOrConflicts = true;
    } else {
      // Network error or temporary failure, stop sync queue processing for now to avoid out of order issues
      if (onStatusChange) onStatusChange('error');
      return false;
    }
  }

  if (onStatusChange) {
    onStatusChange(hasErrorsOrConflicts ? 'error' : 'synced');
  }

  return !hasErrorsOrConflicts;
}
