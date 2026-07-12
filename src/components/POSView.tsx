import { useOrderContext } from '../contexts/OrderContext';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Product,
  ProductCategory,
  SalesChannel,
  Customer,
  OrderItem,
  OrderType,
  PaymentMethod,
  ExtraItem,
  Order,
  User,
  Reward
} from '../types';
import {
  INITIAL_PRODUCTS,
  DELIGHT_EXTRAS,
  DELIGHT_CUBIERTOS
} from '../data/mockData';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  Gift, 
  Percent, 
  Coins, 
  ChevronRight, 
  Sparkles, 
  Grid,
  CheckCircle,
  Coffee,
  Info,
  X,
  QrCode
} from 'lucide-react';

interface POSViewProps {
  customers: Customer[];
  ingredients: any[];
  currentUser: User;
  onOrderCompleted: (order: Order) => Promise<void> | void;
  rewards: Reward[];
  products: Product[];
}

import { useCashRegisterContext } from '../contexts/CashRegisterContext';
import CashRegisterModal from './CashRegisterModal';
export default function POSView({ customers, ingredients, currentUser, onOrderCompleted, rewards, products }: POSViewProps) {
  const { activeRegister, openRegister, isLoading: isRegisterLoading } = useCashRegisterContext();

  if (!activeRegister && !isRegisterLoading) {
    return <div className="w-full h-full"><CashRegisterModal onOpen={openRegister} /></div>;
  }
  // POS State
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<SalesChannel>(SalesChannel.MOSTRADOR);
  
  const [posMode, setPosMode] = useState<'venta' | 'canje' | 'error'>('venta');
  const { orders, setOrdersState } = useOrderContext();
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<Order | null>(null);

  // Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Club DELIGHT Customer State
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  // Canje Mode Toggle
   

  // Modifiers Modal State
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  // Filter Categories
  const categories = useMemo(() => {
    const activeProducts = products.filter(p => p.active !== false && p.isAvailableToday !== false);
    return ['Todos', ...Array.from(new Set(activeProducts.map(p => p.category)))].filter(Boolean);
  }, [products]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.active === false) return false;
      if (product.isAvailableToday === false) return false;
      if ((posMode === 'canje') && !product.allowReward) return false;
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, (posMode === 'canje'), activeCategory, searchQuery]);

  // Handle Customer Search
  const filteredCustomers = useMemo(() => {
    if (!customerQuery) return customers;
    return customers.filter((c) => 
      `${c.name} ${c.lastName}`.toLowerCase().includes(customerQuery.toLowerCase()) ||
      c.phone.includes(customerQuery) ||
      c.id.toLowerCase().includes(customerQuery.toLowerCase()) ||
      (c.qrCode && c.qrCode.toLowerCase().includes(customerQuery.toLowerCase()))
    );
  }, [customers, customerQuery]);

  // Calculate Product Price based on active channel
  const getProductPrice = (product: Product, channel: SalesChannel) => {
    if (channel === SalesChannel.ESPECIAL) {
      // 15% automatic discount on Mostrador
      return product.prices[SalesChannel.MOSTRADOR] * 0.85;
    }
    return product.prices[channel] || product.prices[SalesChannel.MOSTRADOR];
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if ((posMode === 'canje')) {
      // In Canje Mode, we look up the points required from the product
      const pointsRequired = product.rewardPoints ?? 20;

      if (!linkedCustomer) {
        alert('Debes vincular primero a un cliente del Club DELIGHT para realizar canjes.');
        return;
      }

      // Calculate already accumulated points in cart
      const currentCartPoints = cart.reduce((sum, item) => {
        const itemProd = products.find(p => p.id === item.productId);
        const itemPoints = itemProd?.rewardPoints ?? 20;
        return sum + (itemPoints * item.quantity);
      }, 0);

      if (linkedCustomer.pointsAvailable < currentCartPoints + pointsRequired) {
        alert(`Puntos insuficientes. El cliente tiene ${linkedCustomer.pointsAvailable} pts disponibles.`);
        return;
      }
    }

    const price = (posMode === 'canje') ? 0 : getProductPrice(product, activeChannel);
    const existingIndex = cart.findIndex((item) => item.productId === product.id && item.extras.length === 0 && item.selectedCubierto === 'Ninguno');

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].priceUnit;
      setCart(updated);
    } else {
      const newItem: OrderItem = {
        id: `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        quantity: 1,
        priceUnit: price,
        subtotal: price,
        extras: [],
        extrasCost: 0,
        selectedCubierto: 'Ninguno',
        cubiertosCost: 0
      };
      setCart([...cart, newItem]);
    }
  };

  // Remove or Decrement Item
  const handleDecrementItem = (itemId: string) => {
    const existing = cart.find(i => i.id === itemId);
    if (!existing) return;

    if (existing.quantity > 1) {
      setCart(cart.map(item => {
        if (item.id === itemId) {
          const qty = item.quantity - 1;
          const price = item.priceUnit + item.extrasCost + item.cubiertosCost;
          return { ...item, quantity: qty, subtotal: qty * price };
        }
        return item;
      }));
    } else {
      setCart(cart.filter(item => item.id !== itemId));
    }
  };

  const handleIncrementItem = (itemId: string) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const qty = item.quantity + 1;
        const price = item.priceUnit + item.extrasCost + item.cubiertosCost;
        return { ...item, quantity: qty, subtotal: qty * price };
      }
      return item;
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Modifier Management
  const openModifiers = (item: OrderItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
  };

  const saveModifiers = (updatedItem: OrderItem) => {
    setCart(cart.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
  };

  // Totals calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Discount calculation
  const cartDiscount = useMemo(() => {
    // Standard discount for Especial is already factored in priceUnit.
    // If we want to display it as a separate breakdown, we can compute it.
    if (activeChannel === SalesChannel.ESPECIAL && !(posMode === 'canje')) {
      return cart.reduce((sum, item) => {
        const originalPrice = products.find(p => p.id === item.productId)?.prices[SalesChannel.MOSTRADOR] || 0;
        const diff = (originalPrice - item.priceUnit) * item.quantity;
        return sum + diff;
      }, 0);
    }
    return 0;
  }, [cart, activeChannel, (posMode === 'canje'), products]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal);
  }, [cartSubtotal]);

  // Points calculations
  const pointsToGenerate = useMemo(() => {
    if ((posMode === 'canje')) return 0;
    if (activeChannel === SalesChannel.ESPECIAL) return 0; // Rule: Especial doesn't generate points
    if (!linkedCustomer) return 0;

    // Rule: $100 MXN = 1 pt. Only count complete hundreds.
    return Math.floor(cartTotal / 100);
  }, [cartTotal, activeChannel, (posMode === 'canje'), linkedCustomer]);

  const pointsToDeduct = useMemo(() => {
    if (!(posMode === 'canje') || !linkedCustomer) return 0;
    return cart.reduce((sum, item) => {
      const itemProd = products.find(p => p.id === item.productId);
      const points = itemProd?.rewardPoints ?? 20;
      return sum + (points * item.quantity);
    }, 0);
  }, [cart, (posMode === 'canje'), linkedCustomer, products]);

  // Finalize Sale
  const handleFinalizeOrder = async (method: PaymentMethod) => {
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    if ((posMode === 'canje') && !linkedCustomer) {
      alert('Debes vincular un cliente para procesar un canje.');
      return;
    }

    if ((posMode === 'canje') && linkedCustomer && linkedCustomer.pointsAvailable < pointsToDeduct) {
      alert('Puntos insuficientes.');
      return;
    }

    // Verify ingredient recipes (Inventario)
    // Decrement check
    const recipeCheck: Record<string, number> = {};
    cart.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.recipe) {
        prod.recipe.forEach(recipeItem => {
          recipeCheck[recipeItem.ingredientId] = (recipeCheck[recipeItem.ingredientId] || 0) + (recipeItem.quantity * item.quantity);
        });
      }
    });

    // Generate Order
    const prefix = (posMode === 'canje') ? 'CJ' : 'VT';
    const num = Math.floor(1000 + Math.random() * 9000);
    const order: Order = {
      id: crypto.randomUUID(),
      ticketNumber: `${prefix}-${num}`,
      type: (posMode === 'canje') ? 'canje' : 'venta',
      customerId: linkedCustomer?.id,
      customerName: linkedCustomer ? `${linkedCustomer.name} ${linkedCustomer.lastName}` : undefined,
      channel: activeChannel,
      items: cart,
      subtotal: (posMode === 'canje') ? 0 : cartSubtotal + cartDiscount, // original subtotal
      discount: (posMode === 'canje') ? 0 : cartDiscount,
      total: (posMode === 'canje') ? 0 : cartTotal,
      pointsGenerated: pointsToGenerate,
      pointsUsed: pointsToDeduct,
      paymentMethod: (posMode === 'canje') ? 'puntos' : method,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      cashierId: currentUser.id,
      cashierName: currentUser.name
    };

    // Update Customer loyalty ledger in localStorage or parent state
    if (linkedCustomer) {
      const updatedCustomer: Customer = { ...linkedCustomer };
      if ((posMode === 'canje')) {
        updatedCustomer.pointsRedeemed += pointsToDeduct;
        updatedCustomer.pointsAvailable -= pointsToDeduct;
        // Keep registration date, ID, last purchase
        updatedCustomer.lastPurchaseDate = new Date().toISOString().split('T')[0];
      } else {
        updatedCustomer.pointsAccumulated += pointsToGenerate;
        updatedCustomer.pointsAvailable += pointsToGenerate;
        updatedCustomer.totalSpent += cartTotal;
        updatedCustomer.totalPurchases += 1;
        updatedCustomer.lastPurchaseDate = new Date().toISOString().split('T')[0];
      }

      // Persist customer update
      const storedCustomers = JSON.parse(localStorage.getItem('delight_customers') || '[]');
      const customerIdx = storedCustomers.findIndex((c: Customer) => c.id === linkedCustomer.id);
      if (customerIdx > -1) {
        storedCustomers[customerIdx] = updatedCustomer;
      } else {
        storedCustomers.push(updatedCustomer);
      }
      localStorage.setItem('delight_customers', JSON.stringify(storedCustomers));
    }

    // Pass up to register order in database
    try {
      await onOrderCompleted(order);
      setCart([]);
    } catch (e: any) {
      alert("Error al finalizar venta: " + (e.message || "Revisa la consola."));
      return;
    }

    setLinkedCustomer(null);
    setPosMode('venta');
    setActiveChannel(SalesChannel.MOSTRADOR);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:grid lg:grid-cols-12 gap-5 p-3 lg:p-5 font-sans select-none overflow-hidden bg-[#FFFDF8] lg:overflow-hidden relative">
      
      {/* Category Tabs & Product Catalog (Left 8 columns) */}
      <div className="col-span-1 lg:col-span-8 flex flex-col h-full overflow-hidden shrink-0 lg:shrink">
        
        {/* Mode Selector Tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-delight-gray/10 mb-4 shrink-0">
          <button
            onClick={() => { setPosMode('venta'); setCart([]); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors ${posMode === 'venta' ? 'bg-delight-green text-white shadow-md' : 'text-delight-gray hover:text-delight-dark'}`}
          >
            Nueva Venta
          </button>
          <button
            onClick={() => { setPosMode('canje'); setCart([]); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors ${posMode === 'canje' ? 'bg-delight-yellow text-white shadow-md' : 'text-delight-gray hover:text-delight-dark'}`}
          >
            Canje de Puntos
          </button>
          <button
            onClick={() => { setPosMode('error'); setCart([]); }}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors ${posMode === 'error' ? 'bg-red-500 text-white shadow-md' : 'text-delight-gray hover:text-delight-dark'}`}
          >
            Ticket con Error
          </button>
        </div>

        {posMode !== 'error' && (
          <div className="flex justify-between items-center gap-4 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-delight-gray/50 w-5 h-5" />
              <input
                type="text"
                id="product-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-delight-gray/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold outline-none focus:border-delight-green/40 focus:ring-4 focus:ring-delight-green/5 transition-all shadow-sm"
                placeholder={posMode === 'canje' ? "Buscar premio..." : "Buscar maki, frappé, bebida..."}
              />
            </div>
          </div>
        )}

        {posMode === 'error' ? (
          <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-delight-gray/10 p-6 flex flex-col">
             <h3 className="text-lg font-black text-delight-dark uppercase mb-4">Cancelar Ticket</h3>
             <div className="flex gap-4 mb-6">
               <input 
                 type="text" 
                 placeholder="Buscar por Folio (ej. DL-1001)..."
                 className="flex-1 bg-gray-50 border border-delight-gray/10 rounded-xl px-4 py-3 font-semibold outline-none focus:border-delight-green/40"
                 value={ticketSearchQuery}
                 onChange={(e) => setTicketSearchQuery(e.target.value)}
               />
             </div>
             <div className="flex-1 overflow-y-auto">
               {orders.filter(o => o.status !== 'cancelado' && o.ticketNumber.toLowerCase().includes(ticketSearchQuery.toLowerCase())).slice(0, 10).map(order => (
                 <div key={order.id} className="border border-delight-gray/10 p-4 rounded-xl mb-3 flex justify-between items-center bg-gray-50/50 hover:bg-white transition-colors">
                   <div>
                     <div className="font-bold text-delight-dark flex items-center gap-2">
                       Folio: {order.ticketNumber}
                       {order.status === 'solicitado_cancelacion' && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Pendiente</span>}
                     </div>
                     <div className="text-xs text-delight-gray">{new Date(order.createdAt).toLocaleString()}</div>
                     <div className="text-xs font-semibold text-delight-green mt-1">${order.total.toFixed(2)}</div>
                   </div>
                   <button 
                     onClick={() => { setSelectedTicketForCancel(order); setCancelReason(''); }}
                     className="px-4 py-2 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50"
                   >
                     Seleccionar
                   </button>
                 </div>
               ))}
               {orders.length === 0 && <p className="text-xs text-delight-gray text-center mt-10">No hay tickets recientes.</p>}
             </div>
          </div>
        ) : (
          <>
        {/* Categories Tab Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              id={`cat-tab-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setActiveCategory(cat)}
              className={`py-3 px-5 rounded-xl font-bold text-xs shrink-0 transition-all border tracking-wide uppercase ${
                activeCategory === cat
                  ? 'bg-delight-green border-delight-green text-white shadow-md shadow-delight-green/10'
                  : 'bg-white border-delight-gray/10 text-delight-gray hover:bg-delight-dark/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-delight-gray/5 shadow-sm mt-8">
              <ShoppingBag className="w-12 h-12 text-delight-gray/20 mx-auto mb-3" />
              <p className="text-sm font-semibold text-delight-gray">No se encontraron productos disponibles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-3 lg:gap-4 pb-10 lg:pb-0">
              {filteredProducts.map((product) => {
                const price = getProductPrice(product, activeChannel);
                const rewardPoints = product.rewardPoints ?? 20;
                const isRewardDisabled = (posMode === 'canje') && !product.allowReward;

                return (
                  <button
                    key={product.id}
                    type="button"
                    id={`product-card-${product.id}`}
                    disabled={isRewardDisabled}
                    onClick={() => handleAddToCart(product)}
                    className={`bg-white rounded-[1.5rem] p-5 text-left border border-delight-gray/5 hover:border-delight-green/20 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-44 relative group cursor-pointer ${
                      isRewardDisabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'
                    }`}
                  >
                    {/* Category Label */}
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[10px] font-bold text-delight-green uppercase tracking-wider bg-delight-green/10 px-2.5 py-1 rounded-full">
                        {product.category}
                      </span>
                      
                      {(posMode === 'canje') && (
                        product.allowReward ? (
                          <span className="text-[10px] font-bold text-delight-yellow uppercase tracking-wider bg-delight-yellow/10 px-2 py-1 rounded-full flex items-center gap-0.5">
                            <Coins className="w-3.5 h-3.5" />
                            {rewardPoints} pts
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-1 rounded-full">
                            Inactivo
                          </span>
                        )
                      )}
                    </div>

                    {/* Product Name */}
                    <div className="my-2">
                      <h4 className="text-sm font-bold text-delight-dark group-hover:text-delight-green transition-colors leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                      {product.promotionText && product.promotionText.toLowerCase() !== 'sin promoción' && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-white uppercase tracking-wider bg-red-500 px-1.5 py-0.5 rounded-md">
                          {product.promotionText}
                        </span>
                      )}
                    </div>

                    {/* Pricing details */}
                    <div className="flex justify-between items-end w-full pt-2 border-t border-delight-gray/5">
                      <div>
                        {(posMode === 'canje') ? (
                          <span className="text-xs font-bold text-delight-yellow uppercase">
                            {(product.allowReward !== false) ? 'Premio' : 'No Disponible'}
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-delight-gray/40 block leading-none">Precio {activeChannel}</span>
                            <span className="text-base font-extrabold text-delight-dark">${price.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                      
                      {!isRewardDisabled && (
                        <div className="p-2 bg-delight-green/10 text-delight-green rounded-xl group-hover:bg-delight-green group-hover:text-white transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </>
      )}
      </div>

      {/* Cart & Billing Section (Right 4 columns) */}
      
      {/* Mobile Cart Overlay */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsCartOpen(false)}
        />
      )}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col h-full
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:relative lg:translate-x-0 lg:col-span-4 lg:rounded-[2rem] lg:border lg:border-delight-gray/10 lg:shadow-xl
      `}>
        <div className="lg:hidden absolute top-4 right-4 z-50">
          <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        
        {/* Sales Channel Selector */}
        <div className="p-4 bg-[#FFFDF8] border-b border-delight-gray/10">
          <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-2 ml-1">Canal de Venta</label>
          <div className="grid grid-cols-5 gap-1.5 bg-delight-dark/5 p-1 rounded-xl">
            {Object.values(SalesChannel).map((chan) => (
              <button
                key={chan}
                type="button"
                id={`channel-btn-${chan.toLowerCase()}`}
                disabled={(posMode === 'canje')}
                onClick={() => {
                  setActiveChannel(chan);
                  // Recalculate price in cart
                  setCart(cart.map(item => {
                    const prod = INITIAL_PRODUCTS.find(p => p.id === item.productId);
                    if (!prod) return item;
                    const price = getProductPrice(prod, chan);
                    const totalUnit = price + item.extrasCost + item.cubiertosCost;
                    return { ...item, priceUnit: price, subtotal: item.quantity * totalUnit };
                  }));
                }}
                className={`py-2 text-[9px] font-extrabold rounded-lg transition-all ${
                  (posMode === 'canje') ? 'opacity-30 cursor-not-allowed' : ''
                } ${
                  activeChannel === chan && !(posMode === 'canje')
                    ? 'bg-white text-delight-dark shadow shadow-delight-dark/5 font-black'
                    : 'text-delight-gray/80 hover:text-delight-dark'
                }`}
              >
                {chan === SalesChannel.ONLINE_FUTURE ? 'ONLINE' : chan}
              </button>
            ))}
          </div>
        </div>

        {/* Club DELIGHT card link */}
        <div className="p-4 border-b border-delight-gray/10 bg-gradient-to-r from-delight-green/5 to-delight-yellow/5">
          {linkedCustomer ? (
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-delight-green/20 shadow-sm animate-fade-in">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 bg-delight-green/10 rounded-xl flex items-center justify-center text-delight-green font-bold text-sm shrink-0">
                  {linkedCustomer.name[0]}{linkedCustomer.lastName[0]}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-delight-dark">{linkedCustomer.name} {linkedCustomer.lastName}</h5>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-delight-green bg-delight-green/10 px-1.5 py-0.5 rounded">
                      {linkedCustomer.id}
                    </span>
                    <span className="text-[10px] font-bold text-delight-yellow bg-delight-yellow/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Coins className="w-3 h-3" />
                      {linkedCustomer.pointsAvailable} pts disp.
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="unlink-customer-btn"
                onClick={() => {
                  setLinkedCustomer(null);
                  if ((posMode === 'canje')) {
                    setPosMode('venta');
                    setCart([]);
                  }
                }}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                Quitar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
            <button
              type="button"
              id="search-customer-btn"
              onClick={() => setShowCustomerSearch(true)}
              className="flex-1 py-3.5 px-2 bg-white border border-dashed border-delight-green/30 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-delight-green hover:bg-delight-green/5 transition-all cursor-pointer uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" />
              Vincular Cliente
            </button>
            <button
              type="button"
              onClick={() => {
                 const id = prompt("Simulador Escáner: Ingrese ID del cliente contenido en el QR (ej. DL-1001)");
                 if (!id) return;
                 const c = customers.find(c => c.id.toLowerCase() === id.toLowerCase() || c.qrCode.toLowerCase() === id.toLowerCase());
                 if (c) {
                   setLinkedCustomer(c);
                 } else {
                   alert("QR Inválido o Cliente no encontrado.");
                 }
              }}
              className="flex-1 py-3.5 px-2 bg-blue-50 border border-dashed border-blue-300 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-all cursor-pointer uppercase tracking-wider"
            >
              <QrCode className="w-4 h-4" />
              Escanear QR
            </button>
          </div>
          )}
        </div>

        {/* Active Basket Items (Flexible layout) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <ShoppingBag className="w-12 h-12 text-delight-gray/15 mb-3" />
              <p className="text-xs font-bold text-delight-gray/50">Carrito de compras vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-delight-gray/5 rounded-2xl p-3 shadow-sm flex flex-col gap-2 relative group hover:border-delight-green/15 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h5 className="text-xs font-bold text-delight-dark leading-snug">{item.name}</h5>
                    {(posMode === 'canje') ? (
                      <span className="text-[10px] font-bold text-delight-yellow bg-delight-yellow/10 px-1.5 py-0.5 rounded inline-block mt-1">Canje</span>
                    ) : (
                      <span className="text-[11px] text-delight-gray/60 block mt-0.5">
                        ${(item.priceUnit + item.extrasCost + item.cubiertosCost).toFixed(2)} c/u
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-delight-dark">
                      ${(posMode === 'canje') ? '0.00' : item.subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Extras and Cubiertos Subtitle labels */}
                {(item.extras.length > 0 || item.selectedCubierto !== 'Ninguno') && (
                  <div className="bg-delight-dark/5 p-2 rounded-xl text-[10px] text-delight-gray space-y-0.5">
                    {item.extras.map((ex, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>+ {ex}</span>
                        {!(posMode === 'canje') && <span>+${DELIGHT_EXTRAS.find(e => e.name === ex)?.price || 0}</span>}
                      </div>
                    ))}
                    {item.selectedCubierto !== 'Ninguno' && (
                      <div className="flex justify-between font-medium">
                        <span>+ Cubierto: {item.selectedCubierto}</span>
                        {!(posMode === 'canje') && <span>+${DELIGHT_CUBIERTOS.find(c => c.name === item.selectedCubierto)?.price || 0}</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Adjustments and modifiers controls */}
                <div className="flex justify-between items-center mt-1 pt-2 border-t border-delight-gray/5">
                  <button
                    type="button"
                    id={`mod-btn-${item.id}`}
                    onClick={() => openModifiers(item)}
                    className="text-[10px] font-bold text-delight-green hover:text-delight-green-hover hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Personalizar
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`dec-btn-${item.id}`}
                      onClick={() => handleDecrementItem(item.id)}
                      className="p-1 rounded-lg bg-delight-dark/5 hover:bg-delight-dark/10 text-delight-gray transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-delight-dark w-5 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      id={`inc-btn-${item.id}`}
                      onClick={() => handleIncrementItem(item.id)}
                      className="p-1 rounded-lg bg-delight-dark/5 hover:bg-delight-dark/10 text-delight-gray transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`del-btn-${item.id}`}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pricing Summary, points and final pay buttons */}
        <div className="p-4 bg-[#FFFDF8] border-t border-delight-gray/10 space-y-4">
          <div className="space-y-1.5 text-xs text-delight-gray font-semibold">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-delight-dark">${(posMode === 'canje') ? '0.00' : (cartSubtotal + cartDiscount).toFixed(2)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Descuento Especial (15%):</span>
                <span>-${cartDiscount.toFixed(2)}</span>
              </div>
            )}

            {/* Club DELIGHT Live calculation indicator */}
            {linkedCustomer && (
              <div className="py-2 px-3 rounded-xl bg-delight-green/5 border border-delight-green/10 flex items-center justify-between text-xs text-delight-green font-bold">
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-delight-green animate-pulse" />
                  <span>{(posMode === 'canje') ? 'Puntos a restar:' : 'Puntos a acumular:'}</span>
                </div>
                <span>{(posMode === 'canje') ? `-${pointsToDeduct} pts` : `+${pointsToGenerate} pts`}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end border-t border-delight-gray/5 pt-3">
            <span className="text-sm font-bold text-delight-dark">Total a pagar:</span>
            <span className="text-2xl font-black text-delight-dark">${(posMode === 'canje') ? '0.00' : cartTotal.toFixed(2)}</span>
          </div>

          {/* Checkout Controls */}
          {(posMode === 'canje') ? (
            <button
              type="button"
              id="checkout-canje-btn"
              disabled={cart.length === 0}
              onClick={() => handleFinalizeOrder('puntos')}
              className="w-full bg-gradient-to-r from-delight-yellow to-delight-yellow-hover text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-delight-yellow/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Gift className="w-5 h-5" />
              Procesar Canje de Premios
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {['MOSTRADOR', 'ESPECIAL', 'ONLINE_FUTURE'].includes(activeChannel) && (
                <>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('efectivo')}
                    className="bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-3.5 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>💵 Efectivo</span>
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('tarjeta')}
                    className="bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-3.5 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>💳 Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('transferencia')}
                    className="bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-black py-3.5 rounded-xl shadow-md shadow-delight-green/10 text-xs hover:shadow-lg hover:shadow-delight-green/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>⚡ Transferencia</span>
                  </button>
                </>
              )}
              {activeChannel === 'UBER' && (
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => handleFinalizeOrder('plataforma')}
                  className="col-span-3 bg-[#06C167] text-white font-black py-4 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>📱 Pagar en Plataforma Uber Eats</span>
                </button>
              )}
              {activeChannel === 'DIDI' && (
                <>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('plataforma')}
                    className="col-span-2 bg-[#F96D00] text-white font-black py-4 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>📱 Plataforma DiDi</span>
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('efectivo')}
                    className="col-span-1 bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-4 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>💵 Efectivo</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* MODIFIER CONFIG MODAL (IPAD-STYLE SHEET) */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-7 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-delight-dark">Personalizar {editingItem.name}</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Extras */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-delight-gray uppercase tracking-widest">Ingredientes Extras</span>
                <span className="text-[10px] font-bold text-delight-green bg-delight-green/10 px-2 py-0.5 rounded">Opcional</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {DELIGHT_EXTRAS.map((extra) => {
                  const isChecked = editingItem.extras.includes(extra.name);
                  return (
                    <button
                      key={extra.name}
                      type="button"
                      id={`extra-btn-${extra.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        let updatedExtras = [...editingItem.extras];
                        let updatedCost = editingItem.extrasCost;
                        if (isChecked) {
                          updatedExtras = updatedExtras.filter(e => e !== extra.name);
                          updatedCost -= extra.price;
                        } else {
                          updatedExtras.push(extra.name);
                          updatedCost += extra.price;
                        }
                        const totalUnit = editingItem.priceUnit + updatedCost + editingItem.cubiertosCost;
                        saveModifiers({
                          ...editingItem,
                          extras: updatedExtras,
                          extrasCost: updatedCost,
                          subtotal: editingItem.quantity * totalUnit
                        });
                        // Update our editingItem local visual state to keep modal synchronized
                        setEditingItem({
                          ...editingItem,
                          extras: updatedExtras,
                          extrasCost: updatedCost,
                          subtotal: editingItem.quantity * totalUnit
                        });
                      }}
                      className={`p-3 text-left rounded-xl border text-xs font-bold transition-all flex justify-between items-center cursor-pointer ${
                        isChecked
                          ? 'border-delight-green bg-delight-green/5 text-delight-green font-extrabold'
                          : 'border-delight-gray/10 hover:bg-delight-dark/5 text-delight-dark'
                      }`}
                    >
                      <span>{extra.name}</span>
                      <span className="text-[11px] text-delight-gray/60">+${extra.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Cubiertos */}
            <div>
              <span className="text-xs font-bold text-delight-gray uppercase tracking-widest block mb-3">Utensilios / Cubiertos</span>
              <div className="grid grid-cols-3 gap-2.5">
                {DELIGHT_CUBIERTOS.map((cub) => {
                  const isSelected = editingItem.selectedCubierto === cub.name;
                  return (
                    <button
                      key={cub.name}
                      type="button"
                      id={`cubierto-btn-${cub.name.toLowerCase()}`}
                      onClick={() => {
                        const price = cub.price;
                        const totalUnit = editingItem.priceUnit + editingItem.extrasCost + price;
                        saveModifiers({
                          ...editingItem,
                          selectedCubierto: cub.name as any,
                          cubiertosCost: price,
                          subtotal: editingItem.quantity * totalUnit
                        });
                        setEditingItem({
                          ...editingItem,
                          selectedCubierto: cub.name as any,
                          cubiertosCost: price,
                          subtotal: editingItem.quantity * totalUnit
                        });
                      }}
                      className={`p-3 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-delight-green bg-delight-green/5 text-delight-green font-extrabold'
                          : 'border-delight-gray/10 hover:bg-delight-dark/5 text-delight-dark'
                      }`}
                    >
                      <div className="font-extrabold">{cub.name}</div>
                      <div className="text-[10px] text-delight-gray/60 mt-0.5">
                        {cub.price > 0 ? `+$${cub.price}` : 'Gratis'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary details inside Modal */}
            <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-delight-gray/5 flex justify-between items-center text-xs">
              <span className="font-bold text-delight-gray">Total por {editingItem.quantity} unidades:</span>
              <span className="font-black text-sm text-delight-dark">${(posMode === 'canje') ? '0.00' : editingItem.subtotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              id="confirm-modifiers-btn"
              onClick={() => setEditingItem(null)}
              className="w-full py-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Selección
            </button>
          </div>
        </div>
      )}

      {/* CLUB CUSTOMER SEARCH MODAL */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-delight-dark">Vincular Club DELIGHT</h3>
              <button
                type="button"
                onClick={() => setShowCustomerSearch(false)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Simulator Scan Options */}
            <div className="bg-delight-green/5 p-3.5 rounded-2xl mb-4 border border-delight-green/10 text-left shrink-0">
              <span className="text-[9px] font-black uppercase text-delight-green block mb-1.5 tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-delight-green animate-pulse" />
                Simulador de Escáner Físico de QR
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
                {customers.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setLinkedCustomer(c);
                      setShowCustomerSearch(false);
                      setCustomerQuery('');
                      alert(`[Beep!] Código QR de socio detectado.
Cliente: ${c.name} ${c.lastName}
Código: ${c.qrCode}
Puntos: ${c.pointsAvailable} pts
¡Socio vinculado con éxito!`);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-delight-green/20 hover:border-delight-green/50 text-[10px] rounded-lg font-bold text-delight-dark flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5 text-delight-green" />
                    {c.name} ({c.id})
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/40 w-4 h-4" />
              <input
                type="text"
                id="modal-customer-search-input"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
                placeholder="Buscar por ID, nombre, celular o código QR..."
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-center text-xs text-delight-gray/50 py-8">No se encontraron socios del club.</p>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    id={`link-customer-item-${cust.id}`}
                    onClick={() => {
                      setLinkedCustomer(cust);
                      setShowCustomerSearch(false);
                      setCustomerQuery('');
                    }}
                    className="w-full p-3 rounded-xl border border-delight-gray/5 hover:border-delight-green/20 hover:bg-delight-green/5 transition-all text-left flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-delight-dark group-hover:text-delight-green transition-colors">
                        {cust.name} {cust.lastName}
                      </h5>
                      <span className="text-[10px] text-delight-gray/60 block mt-0.5">Cel: {cust.phone} • ID: {cust.id}</span>
                    </div>
                    
                    <div className="bg-delight-yellow/10 text-delight-yellow font-extrabold text-[10px] px-2 py-1 rounded flex items-center gap-0.5">
                      <Coins className="w-3 h-3" />
                      {cust.pointsAvailable} pts
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {!isCartOpen && cart.length > 0 && posMode !== 'error' && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] py-4 bg-delight-dark text-white rounded-2xl shadow-2xl font-black uppercase tracking-widest flex justify-between px-6 items-center z-30"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5"/>
            Ver Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </span>
          <span>${(cart.reduce((sum, item) => sum + item.subtotal, 0) + cart.reduce((sum, item) => sum + item.extrasCost + item.cubiertosCost, 0)).toFixed(2)}</span>
        </button>
      )}

    </div>
  );
}
