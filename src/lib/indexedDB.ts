/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'DelightOS_DB';
const DB_VERSION = 1;

export interface PendingSyncItem {
  id?: number;
  type: 'sale' | 'canje' | 'inventory_movement' | 'customer_create' | 'customer_update' | 'ingredient_create' | 'ingredient_update' | 'product_update' | 'order_status_update' | 'audit_log';
  payload: any;
  timestamp: string;
  status: 'pending' | 'review_required';
  conflictReason?: string;
}

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('ingredients')) {
        db.createObjectStore('ingredients', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('orders')) {
        db.createObjectStore('orders', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('audit_logs')) {
        db.createObjectStore('audit_logs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('system_config')) {
        db.createObjectStore('system_config', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('pending_sync')) {
        db.createObjectStore('pending_sync', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putToStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFromStore(storeName: string, key: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function setStoreBatch<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    store.clear();
    items.forEach(item => store.put(item));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function addToPendingSync(
  type: PendingSyncItem['type'],
  payload: any
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_sync', 'readwrite');
    const store = transaction.objectStore('pending_sync');
    const item: PendingSyncItem = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingSync(): Promise<PendingSyncItem[]> {
  return getAllFromStore<PendingSyncItem>('pending_sync');
}

export async function updatePendingSync(item: PendingSyncItem): Promise<void> {
  return putToStore<PendingSyncItem>('pending_sync', item);
}

export async function removeFromPendingSync(id: number): Promise<void> {
  return deleteFromStore('pending_sync', id);
}

/**
 * ==========================================
 * LOCAL CACHE HELPERS (REPLACES LOCALSTORAGE)
 * ==========================================
 */

export async function loadCachedCustomers(): Promise<any[]> {
  try {
    return await getAllFromStore('customers');
  } catch (e) {
    return [];
  }
}

export async function saveCachedCustomer(customer: any): Promise<void> {
  await putToStore('customers', customer);
}

export async function loadCachedIngredients(): Promise<any[]> {
  try {
    return await getAllFromStore('ingredients');
  } catch (e) {
    return [];
  }
}

export async function saveCachedIngredient(ingredient: any): Promise<void> {
  await putToStore('ingredients', ingredient);
}

export async function loadCachedProducts(): Promise<any[]> {
  try {
    return await getAllFromStore('products');
  } catch (e) {
    return [];
  }
}

export async function saveCachedProduct(product: any): Promise<void> {
  await putToStore('products', product);
}

export async function loadCachedOrders(): Promise<any[]> {
  try {
    return await getAllFromStore('orders');
  } catch (e) {
    return [];
  }
}

export async function saveCachedOrder(order: any): Promise<void> {
  await putToStore('orders', order);
}

export async function loadCachedAuditLogs(): Promise<any[]> {
  try {
    return await getAllFromStore('audit_logs');
  } catch (e) {
    return [];
  }
}

export async function saveCachedAuditLog(log: any): Promise<void> {
  await putToStore('audit_logs', log);
}

export async function loadCachedSystemConfig(): Promise<any | null> {
  try {
    const list = await getAllFromStore<any>('system_config');
    const current = list.find(item => item.key === 'current');
    return current ? current.value : null;
  } catch (e) {
    return null;
  }
}

export async function saveCachedSystemConfig(config: any): Promise<void> {
  await putToStore('system_config', { key: 'current', value: config });
}

