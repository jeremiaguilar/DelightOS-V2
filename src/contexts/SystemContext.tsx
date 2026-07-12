import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Customer, Ingredient, Product, Order, SystemConfig, AuditLog } from '../types';
import { PendingSyncItem } from '../lib/indexedDB';
import { INITIAL_CONFIG, INITIAL_CUSTOMERS, INITIAL_INGREDIENTS, INITIAL_PRODUCTS, INITIAL_USERS } from '../data/mockData';
import { isSupabaseConfigured, isSupabaseActive, setSupabaseActive } from '../lib/supabase';
import {
  checkSupabaseConnection,
  loadSystemConfigFromSupabase,
  saveSystemConfigToSupabase,
  loadCustomersFromSupabase,
  loadIngredientsFromSupabase,
  loadProductsFromSupabase,
  loadOrdersFromSupabase,
  loadAuditLogsFromSupabase,
  saveAuditLogToSupabase,
  loadUsersFromSupabase
} from '../lib/supabaseService';
import {
  loadCachedCustomers,
  saveCachedCustomer,
  loadCachedIngredients,
  saveCachedIngredient,
  loadCachedProducts,
  saveCachedProduct,
  loadCachedOrders,
  saveCachedOrder,
  loadCachedAuditLogs,
  saveCachedAuditLog,
  loadCachedSystemConfig,
  saveCachedSystemConfig,
  addToPendingSync
} from '../lib/indexedDB';
import { syncPendingQueue } from '../lib/syncService';
import { enrichProductsWithRewards } from '../App';

interface SystemContextType {
  dbState: 'checking' | 'initialized' | 'uninitialized';
  syncState: 'connected' | 'offline' | 'syncing' | 'synced' | 'sync_error';
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeTab: 'pos' | 'kds' | 'club' | 'catalog' | 'inventory' | 'rubricas';
  setActiveTab: React.Dispatch<React.SetStateAction<'pos' | 'kds' | 'club' | 'catalog' | 'inventory' | 'rubricas'>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  systemConfig: SystemConfig;
  setSystemConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  registerSyncAction: (type: PendingSyncItem['type'], payload: any, immediateFunc: () => Promise<void>) => Promise<void>;
  addAuditLog: (action: string, previousValue: string, newValue: string, module: string, overrideUser?: User | null) => Promise<void>;
  initializeDatabase: () => Promise<void>;
  triggerConnectionCheckAndSync: () => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('delight_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'club' | 'catalog' | 'inventory' | 'rubricas'>('pos');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [dbState, setDbState] = useState<'checking' | 'initialized' | 'uninitialized'>('checking');
  const [syncState, setSyncState] = useState<'connected' | 'offline' | 'syncing' | 'synced' | 'sync_error'>('offline');

  const reloadStateFromSupabase = async () => {
    try {
      const sConfig = await loadSystemConfigFromSupabase(systemConfig);
      setSystemConfig(sConfig);
      await saveCachedSystemConfig(sConfig);

      const loadedCustomers = await loadCustomersFromSupabase(INITIAL_CUSTOMERS);
      setCustomers(loadedCustomers);
      for (const c of loadedCustomers) {
        await saveCachedCustomer(c);
      }

      const cachedIngredients = await loadCachedIngredients();
      const loadedIngredients = await loadIngredientsFromSupabase([]);
      const mergedIngredients = loadedIngredients.map(si => {
        const cached = cachedIngredients.find((ci: Ingredient) => ci.id === si.id);
        if (cached) {
          return {
            ...si,
            active: cached.active !== undefined ? cached.active : si.active
          };
        }
        return si;
      });
      setIngredients(mergedIngredients);
      for (const i of mergedIngredients) {
        await saveCachedIngredient(i);
      }

      const cachedProducts = await loadCachedProducts();
      const loadedProducts = await loadProductsFromSupabase([]);
      const mergedProducts = loadedProducts.map(sp => {
        const cached = cachedProducts.find((cp: Product) => cp.id === sp.id);
        if (cached) {
          return {
            ...sp,
            active: cached.active !== undefined ? cached.active : sp.active,
            isAvailableToday: cached.isAvailableToday !== undefined ? cached.isAvailableToday : sp.isAvailableToday,
            promotionText: cached.promotionText
          };
        }
        return sp;
      });
      
      const enrichedLoaded = enrichProductsWithRewards(mergedProducts);
      setProducts(enrichedLoaded);
      for (const p of enrichedLoaded) {
        await saveCachedProduct(p);
      }

      const loadedOrders = await loadOrdersFromSupabase([]);
      setOrders(loadedOrders);
      for (const o of loadedOrders) {
        await saveCachedOrder(o);
      }

      const loadedAuditLogs = await loadAuditLogsFromSupabase([]);
      setAuditLogs(loadedAuditLogs);
      for (const l of loadedAuditLogs) {
        await saveCachedAuditLog(l);
      }

      const loadedUsers = await loadUsersFromSupabase(INITIAL_USERS);
      setUsers(loadedUsers);
    } catch (e) {
      console.warn('Error al recargar desde Supabase:', e);
    }
  };

  const initializeDatabase = async () => {
    setDbState('checking');
    try {
      const isDbReady = isSupabaseConfigured ? await checkSupabaseConnection() : false;
      
      if (isDbReady) {
        setSupabaseActive(true);
        setSyncState('connected');
        
        await reloadStateFromSupabase();
        
        await syncPendingQueue((status) => {
          if (status === 'syncing') setSyncState('syncing');
          else if (status === 'synced') setSyncState('synced');
          else if (status === 'error') setSyncState('sync_error');
          else if (status === 'idle') setSyncState('connected');
        });

        setDbState('initialized');
      } else {
        setSupabaseActive(false);
        setSyncState('offline');

        const cachedProducts = await loadCachedProducts();
        const cachedIngredients = await loadCachedIngredients();

        if (true) {
          const cachedCustomers = await loadCachedCustomers();
          const cachedOrders = await loadCachedOrders();
          const cachedAuditLogs = await loadCachedAuditLogs();
          const cachedConfig = await loadCachedSystemConfig();

          setProducts(enrichProductsWithRewards(cachedProducts));
          setIngredients(cachedIngredients);
          setCustomers(cachedCustomers.length > 0 ? cachedCustomers : INITIAL_CUSTOMERS);
          setOrders(cachedOrders);
          setAuditLogs(cachedAuditLogs);
          if (cachedConfig) setSystemConfig(cachedConfig);

          setDbState('initialized');
        }
      }
    } catch (e) {
      console.error('Error al inicializar la base de datos:', e);
      setDbState('uninitialized');
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  const triggerConnectionCheckAndSync = async () => {
    if (syncState === 'syncing') return;
    
    const isDbReady = isSupabaseConfigured ? await checkSupabaseConnection() : false;
    if (isDbReady) {
      setSupabaseActive(true);
      setSyncState('connected');
      
      const success = await syncPendingQueue((status) => {
        if (status === 'syncing') setSyncState('syncing');
        else if (status === 'synced') setSyncState('synced');
        else if (status === 'error') setSyncState('sync_error');
        else if (status === 'idle') setSyncState('connected');
      });

      if (success) {
        await reloadStateFromSupabase();
      }
    } else {
      setSupabaseActive(false);
      setSyncState('offline');
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      triggerConnectionCheckAndSync();
    };
    const handleOffline = () => {
      setSyncState('offline');
      setSupabaseActive(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      if (navigator.onLine) {
        triggerConnectionCheckAndSync();
      }
    }, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncState]);

  const registerSyncAction = async (
    type: PendingSyncItem['type'],
    payload: any,
    immediateFunc: () => Promise<void>
  ) => {
    if (isSupabaseActive) {
      try {
        await immediateFunc();
      } catch (e) {
        console.warn(`Error al sincronizar de inmediato ${type}, guardando en pending_sync:`, e);
        await addToPendingSync(type, payload);
        setSyncState('sync_error');
      }
    } else {
      console.log(`Modo sin conexión: registrando cambio de tipo ${type} en pending_sync`);
      await addToPendingSync(type, payload);
    }
  };

  const addAuditLog = async (
    action: string, 
    previousValue: string, 
    newValue: string, 
    module: string,
    overrideUser: User | null = null
  ) => {
    const now = new Date();
    const activeUser = overrideUser !== null ? overrideUser : currentUser;
    const activeUserLabel = activeUser ? `${activeUser.name} (${activeUser.role})` : 'Sistema';
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user: activeUserLabel,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      action,
      previousValue,
      newValue,
      module
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    await saveCachedAuditLog(newLog);

    await registerSyncAction('audit_log', { log: newLog, userId: activeUser?.id }, async () => {
      await saveAuditLogToSupabase(newLog, activeUser?.id);
    });
  };

  return (
    <SystemContext.Provider value={{
      dbState,
      syncState,
      currentUser,
      setCurrentUser,
      activeTab,
      setActiveTab,
      customers,
      setCustomers,
      ingredients,
      setIngredients,
      products,
      setProducts,
      orders,
      setOrders,
      systemConfig,
      setSystemConfig,
      auditLogs,
      setAuditLogs,
      users,
      setUsers,
      soundEnabled,
      setSoundEnabled,
      registerSyncAction,
      addAuditLog,
      initializeDatabase,
      triggerConnectionCheckAndSync
    }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystemContext = () => {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystemContext must be used within a SystemProvider');
  return context;
};
