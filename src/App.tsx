/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  User, 
  Product, 
  ProductCategory
} from './types';
import { getRoleDisplayName } from './utils/roleHelper';
import { saveCachedProduct, saveCachedIngredient } from './lib/indexedDB';
import { saveProductToSupabase, saveIngredientToSupabase } from './lib/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';

// Views
import LoginView from './components/LoginView';
import POSView from './components/POSView';
import KdsView from './components/KdsView';
import ClubDelightView from './components/ClubDelightView';
import CatalogView from './components/CatalogView';
import InventoryView from './components/InventoryView';
import RubricasGerencialesView from './components/RubricasGerencialesView';
import TicketModal from './components/TicketModal';
import CashRegisterModal from './components/CashRegisterModal';
import CashRegisterView from './components/CashRegisterView';

// Contexts & Providers
import { SystemProvider, useSystemContext } from './contexts/SystemContext';
import { UserProvider, useUserContext } from './contexts/UserContext';
import { ConfigProvider, useConfigContext } from './contexts/ConfigContext';
import { CustomerProvider, useCustomerContext } from './contexts/CustomerContext';
import { InventoryProvider, useInventoryContext } from './contexts/InventoryContext';
import { OrderProvider, useOrderContext } from './contexts/OrderContext';
import { KDSProvider, useKDSContext } from './contexts/KDSContext';
import { ClubDelightProvider } from './contexts/ClubDelightContext';
import { CashRegisterProvider, useCashRegisterContext } from './contexts/CashRegisterContext';

// Icons
import { 
  ShoppingBag, 
  Flame, 
  Users, 
  Layers, 
  Archive, 
  BarChart3, 
  LogOut, 
  ShieldAlert, 
  Wallet,
  Menu,
  X,
  Shield,
  MapPin
} from 'lucide-react';

interface ProductRewardConfig {
  allowReward: boolean;
  rewardPoints: number;
}

export function getProductRewardConfigs(): Record<string, ProductRewardConfig> {
  const saved = localStorage.getItem('delight_product_rewards');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading product reward configs", e);
    }
  }
  return {};
}

export function saveProductRewardConfigs(configs: Record<string, ProductRewardConfig>) {
  localStorage.setItem('delight_product_rewards', JSON.stringify(configs));
}

export function getDefaultRewardPointsForProduct(product: { category: string, name?: string }): number {
  if (product.category === 'Extras') return 5;
  if (product.category === 'Café') return 20;
  if (product.category === 'Frappés') return 20;
  if (product.category === 'Smoothies') return 20;
  if (product.category === 'Sushiburger') return 50;
  
  if (product.category === 'Makis' || product.category?.includes('Makis')) {
    if (product.name?.toLowerCase().includes('empanizado')) return 45;
    return 40; // Default Makis (Naturales / Queso)
  }
  
  return 20;
}

export function enrichProductsWithRewards(prods: Product[]): Product[] {
  const configs = getProductRewardConfigs();
  return prods.map(p => {
    const config = configs[p.id];
    return {
      ...p,
      allowReward: config ? config.allowReward : true,
      rewardPoints: config ? config.rewardPoints : getDefaultRewardPointsForProduct(p)
    };
  });
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const {
    dbState,
    syncState,
    activeTab,
    setActiveTab,
    customers,
    setCustomers,
    ingredients,
    products,
    orders,
    systemConfig,
    auditLogs,
    users,
    soundEnabled,
    setSoundEnabled,
    initializeDatabase,
    addAuditLog
  } = useSystemContext();

  const { currentUser, login, logout, updateUsers, hasAccess } = useUserContext();
  const { updateConfig } = useConfigContext();
  const { addCustomer, updateCustomer } = useCustomerContext();
  const { addIngredient, updateIngredient, adjustStock, setIngredientsState } = useInventoryContext();
  const {
    rewards,
    selectedOrderForTicket,
    setSelectedOrderForTicket,
    orderCompleted,
    updateProduct,
    updateProductReward,
    applyPointsToCategory,
    resetOfficialRewards,
    setOrdersState,
    setProductsState
  } = useOrderContext();

  const { activeKdsCount, updateOrderStatus } = useKDSContext();
  const { activeRegister, openRegister, isLoading: isRegisterLoading } = useCashRegisterContext();

  if (dbState === 'checking') {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full border-4 border-delight-green/20 border-t-delight-green animate-spin mb-4" />
        <h3 className="text-sm font-black text-delight-dark uppercase tracking-widest leading-none">Iniciando DelightOS</h3>
        <p className="text-xs text-delight-gray/60 mt-1.5">Verificando base de datos y sincronización...</p>
      </div>
    );
  }

  if (dbState === 'uninitialized') {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-5 border border-amber-100 shadow-sm">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-lg font-black text-delight-dark uppercase tracking-wider leading-none">Base de datos no inicializada</h2>
        <p className="text-xs text-delight-gray/70 mt-3 leading-relaxed">
          El sistema no pudo conectarse a la base de datos oficial (Supabase) y no existe un respaldo local previo en este navegador. Para poder operar, se requiere una conexión inicial exitosa.
        </p>
        
        <div className="w-full mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={initializeDatabase}
            className="w-full py-3 px-4 bg-delight-dark hover:bg-delight-dark-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-delight-dark/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={login} />;
  }

  const renderSyncIndicator = () => {
    switch (syncState) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100" title="DelightOS está en línea y conectado a Supabase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Conectado</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100" title="DelightOS está fuera de línea. Los datos se guardan de forma segura en local">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Sin conexión</span>
          </div>
        );
      case 'syncing':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 animate-pulse" title="Sincronizando operaciones pendientes con Supabase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Sincronizando</span>
          </div>
        );
      case 'synced':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200" title="Todas las operaciones han sido sincronizadas">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Sincronizado</span>
          </div>
        );
      case 'sync_error':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 animate-pulse" title="Error de sincronización. Hay cambios pendientes que requieren revisión">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-center">Error Sincronización</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col overflow-hidden text-delight-dark antialiased">
      
      <div className="bg-delight-dark text-white py-1 px-4 text-[10px] flex justify-between items-center hidden md:flex font-mono z-40 relative">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-delight-green"/> {currentUser.name} ({currentUser.role})</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-delight-yellow"/> {systemConfig?.ticket?.businessName || 'Sucursal Principal'}</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 font-bold uppercase">{activeRegister ? <span className="text-green-400">● Caja Abierta</span> : <span className="text-red-400">● Caja Cerrada</span>}</span>
          <span className="flex items-center gap-1.5 font-bold uppercase">{isSupabaseConfigured ? <span className="text-blue-400">● Nube Activa</span> : <span className="text-amber-400">● Local Mode</span>}</span>
          <span>{renderSyncIndicator()}</span>
        </div>
      </div>
      <header className="h-16 bg-white border-b border-delight-gray/10 flex justify-between items-center px-4 md:px-6 shrink-0 shadow-sm z-30 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-delight-green to-delight-green-hover flex items-center justify-center text-white font-black text-sm shadow-md shadow-delight-green/10">
            D
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-delight-dark">Delight</h1>
            <span className="text-[10px] font-bold text-delight-green uppercase tracking-widest block mt-0.5">Frappés & Drinks</span>
          </div>
        </div>

                <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
        </button>
        <nav className={`fixed inset-x-0 top-16 bg-white border-b p-4 flex-col gap-2 z-40 shadow-xl transition-all md:relative md:top-0 md:bg-delight-dark/5 md:p-1 md:rounded-xl md:flex-row md:flex md:shadow-none ${mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
          <button
            type="button"
            id="nav-pos"
            onClick={() => { setActiveTab('pos'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            Punto de Venta
          </button>

          <button
            type="button"
            id="nav-kds"
            onClick={() => { setActiveTab('kds'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all relative cursor-pointer ${
              activeTab === 'kds'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            Cocina KDS
            {activeKdsCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-red-500 text-white font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                {activeKdsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="nav-club"
            onClick={() => { setActiveTab('club'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'club'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            Club DELIGHT
          </button>

          <button
            type="button"
            id="nav-catalog"
            onClick={() => { setActiveTab('catalog'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            Catálogo
          </button>

          <button
            type="button"
            id="nav-inventory"
            onClick={() => { setActiveTab('inventory'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            Inventario
          </button>

                    <button
            type="button"
            id="nav-caja"
            onClick={() => { setActiveTab('caja'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'caja'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            Caja
          </button>
          <button
            onClick={() => { setActiveTab('rubricas'); setMobileMenuOpen(false); }}
            className={`py-2 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'rubricas'
                ? 'bg-white text-delight-dark shadow-sm'
                : 'text-delight-gray/70 hover:text-delight-dark'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            Reportes
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {renderSyncIndicator()}

          <div className="text-right hidden sm:block">
            <h5 className="text-xs font-bold text-delight-dark">{currentUser.name}</h5>
            <span className="text-[9px] font-bold text-delight-green uppercase bg-delight-green/10 px-2 py-0.5 rounded">
              {getRoleDisplayName(currentUser.role)}
            </span>
          </div>

          <button
            type="button"
            id="logout-btn"
            onClick={logout}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors cursor-pointer"
            title="Cerrar Sesión (Borra Caché de Sesión)"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === 'pos' && (
          <POSView 
            customers={customers} 
            ingredients={ingredients} 
            currentUser={currentUser}
            onOrderCompleted={(newOrder) => orderCompleted(newOrder, currentUser, customers, setCustomers)}
            rewards={rewards}
            products={products}
          />
        )}

        {activeTab === 'kds' && (
          <KdsView
            orders={orders}
            onUpdateOrderStatus={updateOrderStatus}
            onOpenTicket={(o) => setSelectedOrderForTicket(o)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />
        )}

        {activeTab === 'club' && (
          <ClubDelightView
            customers={customers}
            orders={orders}
            onAddCustomer={addCustomer}
            onUpdateCustomer={updateCustomer}
            rewards={rewards}
          />
        )}

        {activeTab === 'catalog' && (
          hasAccess(['admin', 'manager']) ? (
            <CatalogView
              products={products}
              ingredients={ingredients}
              onUpdateProduct={updateProduct}
              rewards={rewards}
              onUpdateProductReward={updateProductReward}
              onApplyPointsToCategory={applyPointsToCategory}
              onResetOfficialRewards={resetOfficialRewards}
              onImportCatalog={async (newProducts, updatedProducts, newIngredients) => {
                const combinedProducts = [...products.filter(p => !updatedProducts.find(up => up.id === p.id)), ...updatedProducts, ...newProducts];
                setProductsState(combinedProducts);
                
                const results = await Promise.allSettled([
                  ...newProducts.map(async p => { await saveCachedProduct(p); await saveProductToSupabase(p); }),
                  ...updatedProducts.map(async p => { await saveCachedProduct(p); await saveProductToSupabase(p); })
                ]);
                const errors = results.filter(r => r.status === 'rejected');
                if (errors.length > 0) {
                   console.error("Errors saving catalog:", errors);
                   throw new Error("Error al guardar productos en Supabase. Ver consola.");
                }
                
                const combinedIngredients = [...ingredients, ...newIngredients];
                setIngredientsState(combinedIngredients);
                const ingResults = await Promise.allSettled(
                  newIngredients.map(async i => { await saveCachedIngredient(i); await saveIngredientToSupabase(i); })
                );
                const ingErrors = ingResults.filter(r => r.status === 'rejected');
                if (ingErrors.length > 0) {
                   console.error("Errors saving ingredients:", ingErrors);
                   throw new Error("Error al guardar insumos en Supabase. Ver consola.");
                }
                
                // Recargar desde Supabase para verificar que se guardó correctamente
                const { loadProductsFromSupabase } = await import('./lib/supabaseService');
                const reloadedProducts = await loadProductsFromSupabase([]);
                if (reloadedProducts.length > 0) {
                   setProductsState(reloadedProducts);
                   for (const rp of reloadedProducts) {
                     await saveCachedProduct(rp);
                   }
                }
                
                addAuditLog(
                  'IMPORT_CATALOG',
                  `${products.length} productos, ${ingredients.length} insumos`,
                  `${combinedProducts.length} productos, ${combinedIngredients.length} insumos`,
                  'Catalog'
                );
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#FFFDF8]">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-3 animate-bounce" />
              <h3 className="text-sm font-black text-delight-dark uppercase tracking-wider">Acceso Restringido</h3>
              <p className="text-xs text-delight-gray/60 mt-1 max-w-sm">Esta sección requiere rol de Administrador o Gerente. Su rol actual es: <strong className="uppercase">{getRoleDisplayName(currentUser.role)}</strong>.</p>
            </div>
          )
        )}

        {activeTab === 'inventory' && (
          hasAccess(['admin', 'manager']) ? (
            <InventoryView
              ingredients={ingredients}
              onAddIngredient={addIngredient}
              onUpdateIngredient={updateIngredient}
              onAdjustStock={adjustStock}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#FFFDF8]">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-3 animate-bounce" />
              <h3 className="text-sm font-black text-delight-dark uppercase tracking-wider">Acceso Restringido</h3>
              <p className="text-xs text-delight-gray/60 mt-1 max-w-sm">Esta sección requiere rol de Administrador o Gerente. Su rol actual es: <strong className="uppercase">{currentUser.role}</strong>.</p>
            </div>
          )
        )}

        {activeTab === 'rubricas' && (
          hasAccess(['admin', 'manager']) ? (
            <RubricasGerencialesView
              orders={orders}
              customers={customers}
              config={systemConfig}
              onUpdateConfig={updateConfig}
              auditLogs={auditLogs}
              currentUser={currentUser}
              users={users}
              onUpdateUsers={updateUsers}
              ingredients={ingredients}
              products={products}
              onUpdateIngredient={updateIngredient}
              onUpdateCustomer={updateCustomer}
              onUpdateOrders={(updatedOrders) => setOrdersState(updatedOrders)}
              addAuditLog={addAuditLog}
              onUpdateProducts={(updated) => { setProductsState(updated); updated.forEach(p => saveCachedProduct(p)); }}
              onUpdateIngredients={(updated) => { setIngredientsState(updated); updated.forEach(i => saveCachedIngredient(i)); }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#FFFDF8]">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-3 animate-bounce" />
              <h3 className="text-sm font-black text-delight-dark uppercase tracking-wider">Acceso Restringido</h3>
              <p className="text-xs text-delight-gray/60 mt-1 max-w-sm">Esta sección requiere rol de Administrador o Gerente. Su rol actual es: <strong className="uppercase">{getRoleDisplayName(currentUser.role)}</strong>.</p>
            </div>
          )
        )}
      </main>

      {selectedOrderForTicket && (
        <TicketModal
          order={selectedOrderForTicket}
          config={systemConfig.ticket}
          onClose={() => setSelectedOrderForTicket(null)}
        />
      )}
      
    </div>
  );
}

export default function App() {
  return (
    <SystemProvider>
      <ConfigProvider>
        <UserProvider>
          <CustomerProvider>
            <InventoryProvider>
              <CashRegisterProvider>
                <OrderProvider>
                <KDSProvider>
                  <ClubDelightProvider>
                    <AppContent />
                  </ClubDelightProvider>
                </KDSProvider>
              </OrderProvider>
              </CashRegisterProvider>
            </InventoryProvider>
          </CustomerProvider>
        </UserProvider>
      </ConfigProvider>
    </SystemProvider>
  );
}
