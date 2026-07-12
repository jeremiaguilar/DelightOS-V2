import { supabase, isSupabaseConfigured, isSupabaseActive, setSupabaseActive } from './supabase';
import { 
  Customer, 
  Ingredient, 
  Product, 
  Order, 
  OrderItem, 
  SystemConfig, 
  AuditLog, 
  User,
  UserRole,
  SalesChannel,
  ProductCategory,
  KdsStatus,
  PaymentMethod
} from '../types';

// Default Branch ID used for Multi-Branch architecture in this applet instance
export const DEFAULT_BRANCH_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Checks if Supabase connection is active and database tables exist
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { data, error } = await supabase
      .from('business_config')
      .select('branch_id')
      .limit(1);
    
    if (error) {
      console.warn('Supabase: La consulta de prueba falló (las tablas pueden no estar creadas):', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase: No se pudo conectar al servidor de base de datos:', e);
    return false;
  }
}

/**
 * ==========================================
 * 1. CONFIGURATION SYNCHRONIZATION
 * ==========================================
 */

export async function loadSystemConfigFromSupabase(fallback: SystemConfig): Promise<SystemConfig> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data: bConfig } = await supabase
      .from('business_config')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .maybeSingle();

    const { data: tConfig } = await supabase
      .from('ticket_config')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .maybeSingle();

    const { data: kConfig } = await supabase
      .from('kds_config')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .maybeSingle();

    if (!tConfig) return fallback;

    let ticketData = { ...fallback.ticket };
    if (tConfig.header_message && tConfig.header_message.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(tConfig.header_message);
        ticketData = {
          ...ticketData,
          ...parsed,
          businessName: tConfig.business_name || parsed.businessName || ticketData.businessName,
          ticketSize: (tConfig.paper_width as '58mm' | '80mm') || parsed.ticketSize || ticketData.ticketSize,
          footerText: tConfig.footer_message || parsed.footerText || ticketData.footerText,
          showCashier: tConfig.show_cashier ?? parsed.showCashier ?? ticketData.showCashier
        };
      } catch (e) {
        console.warn('Error parsing JSON header_message:', e);
      }
    } else {
      ticketData = {
        logoText: 'D',
        businessName: tConfig.business_name || 'Delight Frappés & Drinks',
        address: tConfig.header_message || 'Av. Tepeyac 123, Guadalajara, Jal.',
        phone: '33 1234 5678',
        whatsapp: '33 1234 5678',
        footerText: tConfig.footer_message || '¡Gracias por su preferencia!',
        showTax: false,
        showCashier: tConfig.show_cashier ?? true,
        showPointsInfo: true,
        taxPercent: 16,
        ticketSize: tConfig.paper_width as '58mm' | '80mm',
        copies: 1,
        printSetting: tConfig.print_destination === 'Ticket' ? 'ticket_only' :
                     tConfig.print_destination === 'Cocina' ? 'kitchen_only' :
                     tConfig.print_destination === 'Ambos' ? 'both' : 'no_kitchen_kds_only'
      };
    }

    return {
      ticket: ticketData,
      sounds: {
        newOrder: kConfig?.sound_notification ?? true,
        upcomingExpiry: kConfig?.sound_notification ?? true,
        delayed: kConfig?.sound_notification ?? true,
        ready: kConfig?.sound_notification ?? true
      }
    };
  } catch (error) {
    console.warn('Error loading configuration from Supabase:', error);
    return fallback;
  }
}

export async function saveSystemConfigToSupabase(config: SystemConfig): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    const printDestination = config.ticket.printSetting === 'ticket_only' ? 'Ticket' :
                             config.ticket.printSetting === 'kitchen_only' ? 'Cocina' :
                             config.ticket.printSetting === 'both' ? 'Ambos' : 'Solo KDS';

    // Update ticket config with stringified full ticket config JSON in header_message
    await supabase.from('ticket_config').upsert({
      branch_id: DEFAULT_BRANCH_ID,
      business_name: config.ticket.businessName,
      paper_width: config.ticket.ticketSize,
      print_destination: printDestination,
      show_cashier: config.ticket.showCashier,
      header_message: JSON.stringify(config.ticket),
      footer_message: config.ticket.footerText
    });

    // Update business config
    await supabase.from('business_config').upsert({
      branch_id: DEFAULT_BRANCH_ID,
      business_name: config.ticket.businessName,
      points_per_amount: 100,
      points_earned_rule: 'floor(total / 100)'
    });

    // Update kds config
    await supabase.from('kds_config').upsert({
      branch_id: DEFAULT_BRANCH_ID,
      target_prep_time_minutes: 18,
      sound_notification: config.sounds.newOrder
    });
  } catch (error) {
    console.warn('Error saving config to Supabase:', error);
  }
}

/**
 * ==========================================
 * 2. CUSTOMERS (CLUB DELIGHT) SYNCHRONIZATION
 * ==========================================
 */

export async function loadCustomersFromSupabase(fallback: Customer[]): Promise<Customer[]> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .order('name', { ascending: true });

    if (error) throw error;
    if (!data) return fallback;

    return data.map(c => {
      const qrCode = c.qr_code || '';
      // If qr_code is formatted like CLUB-DL-XXXX, clean up ID to be DL-XXXX
      const displayId = qrCode.startsWith('CLUB-') ? qrCode.replace('CLUB-', '') : (qrCode || `DL-${c.id.substring(0, 4).toUpperCase()}`);
      return {
        id: displayId,
        name: c.name.split(' ')[0] || c.name,
        lastName: c.name.split(' ').slice(1).join(' ') || '',
        phone: c.phone || '',
        birthdate: c.birthdate || c.email || '1995-01-01', // Load birthdate from birthdate column with email fallback
        qrCode: qrCode || `CLUB-${displayId}`,
        registrationDate: c.registration_date || new Date(c.created_at).toISOString().split('T')[0],
        lastPurchaseDate: c.last_purchase_at ? new Date(c.last_purchase_at).toLocaleDateString('es-MX') : undefined,
        totalSpent: Number(c.total_spent) || 0,
        totalPurchases: 0, // Computed dynamically if needed
        pointsAccumulated: Number(c.points) || 0, // Synchronized with active points balance
        pointsRedeemed: 0,
        pointsAvailable: Number(c.points) || 0
      };
    });
  } catch (error) {
    console.warn('Error loading customers from Supabase:', error);
    return fallback;
  }
}

export async function saveCustomerToSupabase(customer: Customer): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    const fullName = `${customer.name} ${customer.lastName}`.trim();
    const cleanId = customer.id.replace('DL-', '');

    const payload = {
      name: fullName,
      phone: customer.phone,
      birthdate: customer.birthdate || '1995-01-01', // Store birthdate in the correct column
      email: '', // Clear email so we do not misuse it
      qr_code: customer.qrCode || `CLUB-${customer.id}`,
      points: customer.pointsAvailable,
      total_spent: customer.totalSpent,
      registration_date: customer.registrationDate || new Date().toISOString().split('T')[0],
      branch_id: DEFAULT_BRANCH_ID,
      status: 'activo'
    };

    // If it's a real UUID, we can update or insert by ID, else search by QR Code
    const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    if (isRealUUID) {
      await supabase.from('customers').upsert({ id: cleanId, ...payload });
    } else {
      // Upsert based on qr_code/ID uniqueness
      const { data } = await supabase
        .from('customers')
        .select('id')
        .or(`qr_code.eq.${payload.qr_code},qr_code.eq.${customer.id}`)
        .maybeSingle();

      if (data?.id) {
        await supabase.from('customers').update(payload).eq('id', data.id);
      } else {
        await supabase.from('customers').insert(payload);
      }
    }
  } catch (error) {
    console.warn('Error saving customer to Supabase:', error);
  }
}

/**
 * ==========================================
 * 3. PRODUCTS & PRICES SYNCHRONIZATION
 * ==========================================
 */

export async function loadProductsFromSupabase(fallback: Product[]): Promise<Product[]> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data: dbProducts, error: pErr } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (pErr) throw pErr;
    if (!dbProducts) return fallback;

    const { data: dbPrices, error: prErr } = await supabase
      .from('product_prices')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID);

    if (prErr) throw prErr;

    const { data: dbRecipes } = await supabase
      .from('recipes')
      .select('*');

    return dbProducts.map(p => {
      // Reconstruct prices dictionary
      const pricesDict = {
        [SalesChannel.MOSTRADOR]: 0,
        [SalesChannel.UBER]: 0,
        [SalesChannel.DIDI]: 0,
        [SalesChannel.ESPECIAL]: 0,
        [SalesChannel.ONLINE_FUTURE]: 0
      };

      if (dbPrices) {
        const itemPrices = dbPrices.filter(pr => pr.product_id === p.id);
        itemPrices.forEach(pr => {
          if (pr.sales_channel in pricesDict) {
            pricesDict[pr.sales_channel as SalesChannel] = Number(pr.price);
          }
        });
      }

      // If price is missing for UBER/DIDI/ESPECIAL, populate based on business logic
      if (pricesDict.MOSTRADOR > 0) {
        if (!pricesDict.ESPECIAL) pricesDict.ESPECIAL = Math.round(pricesDict.MOSTRADOR * 0.85);
        if (!pricesDict.UBER) pricesDict.UBER = Math.round(pricesDict.MOSTRADOR * 1.25);
        if (!pricesDict.DIDI) pricesDict.DIDI = Math.round(pricesDict.MOSTRADOR * 1.22);
        if (!pricesDict.ONLINE_FUTURE) pricesDict.ONLINE_FUTURE = pricesDict.MOSTRADOR;
      }

      // Reconstruct recipe
      const recipeList = dbRecipes
        ? dbRecipes
            .filter(r => r.product_id === p.id)
            .map(r => ({
              ingredientId: r.ingredient_id,
              quantity: Number(r.quantity)
            }))
        : [];

      return {
        id: p.id,
        name: p.name,
        category: p.category as ProductCategory,
        mainCategory: p.main_category || undefined,
        subCategory: p.sub_category || undefined,
        family: p.family || undefined,
        image: p.image_url || undefined,
        active: p.active !== false,
        isAvailableToday: p.is_available_today !== false,
        promotionText: p.promotion_text || undefined,
        prices: pricesDict,
        recipe: recipeList,
        allowReward: p.allow_reward !== false,
        rewardPoints: p.reward_points ?? 20
      };
    });
  } catch (error) {
    console.warn('Error loading products from Supabase:', error);
    return fallback;
  }
}

export async function saveProductToSupabase(product: Product): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    // 1. Update product base info (excluding points_value, keep code & image)
    const { data: savedProduct, error: productErr } = await supabase.from('products').upsert({
      id: product.id,
      code: product.id.substring(0, 8).toUpperCase(),
      name: product.name,
      category: product.category,
      image_url: product.image || '',
      points_cost: product.rewardPoints ?? 20, // Costo default de canje por bebida
      allow_reward: product.allowReward !== false,
      reward_points: product.rewardPoints ?? 20,
      active: product.active !== false,
      is_available_today: product.isAvailableToday !== false,
      promotion_text: product.promotionText || null,
      main_category: product.mainCategory || null,
      sub_category: product.subCategory || null,
      family: product.family || null
    }).select('id').single();
    if (productErr) {
    console.error("ERROR COMPLETO DE SUPABASE:");
    console.error(JSON.stringify(productErr, null, 2));
    throw productErr;
}

    if (!savedProduct) return;

    // 2. Save individual relational pricing rows (decoupled from JSON)
    const pricePayloads = Object.entries(product.prices).map(([channel, val]) => ({
      product_id: savedProduct.id,
      sales_channel: channel,
      price: val,
      branch_id: DEFAULT_BRANCH_ID
    }));

    for (const payload of pricePayloads) {
      const { error: priceErr } = await supabase.from('product_prices').upsert(payload, {
        onConflict: 'product_id,sales_channel,branch_id'
      });
      if (priceErr) { console.error('Supabase price insert error:', priceErr); throw priceErr; }
    }

    // 3. Save recipe relationships if any
    if (product.recipe && product.recipe.length > 0) {
      // Clear existing recipes for product
      await supabase.from('recipes').delete().eq('product_id', savedProduct.id);
      
      const recipePayloads = product.recipe.map(r => ({
        product_id: savedProduct.id,
        ingredient_id: r.ingredientId,
        quantity: r.quantity
      }));
      await supabase.from('recipes').insert(recipePayloads);
    }
  } catch (error) {
    console.warn('Error saving product to Supabase:', error);
  }
}

/**
 * ==========================================
 * 4. INGREDIENTS & INVENTORY MOVEMENTS
 * ==========================================
 */

export async function loadIngredientsFromSupabase(fallback: Ingredient[]): Promise<Ingredient[]> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .order('name', { ascending: true });

    if (error) throw error;
    if (!data) return fallback;

    return data.map(i => ({
      id: i.id,
      name: i.name,
      stock: Number(i.current_stock) || 0,
      unit: i.unit,
      minStock: Number(i.min_stock) || 0,
      active: true
    }));
  } catch (error) {
    console.warn('Error loading ingredients from Supabase:', error);
    return fallback;
  }
}

export async function saveIngredientToSupabase(ing: Ingredient): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    await supabase.from('ingredients').upsert({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      current_stock: ing.stock,
      min_stock: ing.minStock,
      branch_id: DEFAULT_BRANCH_ID,
      cost: 5.00 // Default estimated ingredient cost
    });
  } catch (error) {
    console.warn('Error saving ingredient to Supabase:', error);
  }
}

export async function recordInventoryMovement(
  ingredientId: string,
  type: 'entrada' | 'salida' | 'venta' | 'canje' | 'merma' | 'ajuste',
  quantity: number,
  notes: string,
  orderId?: string
): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    await supabase.from('inventory_movements').insert({
      ingredient_id: ingredientId,
      branch_id: DEFAULT_BRANCH_ID,
      type,
      quantity,
      reference_id: orderId || null,
      notes
    });
  } catch (error) {
    console.warn('Error logging inventory movement to Supabase:', error);
  }
}

/**
 * ==========================================
 * 5. ORDERS & SALES RECORDING (TRANSACTIONAL)
 * ==========================================
 */

export async function loadOrdersFromSupabase(fallback: Order[]): Promise<Order[]> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data: dbOrders, error: oErr } = await supabase
      .from('orders')
      .select('*, profiles(name), customers(qr_code)')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .order('created_at', { ascending: false });

    if (oErr) throw oErr;
    if (!dbOrders) return fallback;

    const { data: dbItems } = await supabase
      .from('order_items')
      .select('*, products(name)');

    return dbOrders.map(o => {
      const itemsList = dbItems
        ? dbItems
            .filter(i => i.order_id === o.id)
            .map(i => ({
              id: i.id,
              productId: i.product_id || '',
              name: i.products?.name || 'Producto Desconocido',
              quantity: i.quantity,
              priceUnit: Number(i.unit_price),
              subtotal: Number(i.total_price),
              extras: [],
              extrasCost: 0,
              selectedCubierto: 'Ninguno' as 'Palillos' | 'Tenedor' | 'Ninguno',
              cubiertosCost: 0
            }))
        : [];

      // Map Supabase customer_id UUID to frontend DL-XXXX format via the joined qr_code
      let mappedCustomerId = undefined;
      if (o.customers && typeof o.customers === 'object') {
        const qrCode = (o.customers as any).qr_code || '';
        mappedCustomerId = qrCode.startsWith('CLUB-') ? qrCode.replace('CLUB-', '') : qrCode;
      }
      if (!mappedCustomerId && o.customer_id) {
        mappedCustomerId = o.customer_id;
      }

      return {
        id: o.id,
        ticketNumber: o.ticket_number || o.folio,
        type: o.ticket_type === 'Canje' ? 'canje' : 'venta',
        customerId: mappedCustomerId || undefined,
        customerName: o.customer_display_name || undefined,
        channel: o.sales_channel as SalesChannel,
        items: itemsList,
        subtotal: Number(o.total) + Number(o.discount),
        discount: Number(o.discount),
        total: Number(o.total),
        pointsGenerated: o.points_earned || 0,
        pointsUsed: o.points_redeemed || 0,
        paymentMethod: o.payment_method?.toLowerCase() as PaymentMethod || 'efectivo',
        status: o.status === 'pending' ? 'pendiente' : o.status === 'preparing' ? 'preparacion' : 'listo',
        createdAt: o.created_at,
        startedAt: o.kds_started_at || undefined,
        completedAt: o.kds_completed_at || undefined,
        elapsedSeconds: o.kds_elapsed_seconds || undefined,
        cashierId: o.cashier_id || '00000000-0000-0000-0000-000000000000',
        cashierName: (o.profiles as any)?.name || 'Cajero'
      };
    });
  } catch (error) {
    console.warn('Error loading orders from Supabase:', error);
    return fallback;
  }
}

export async function saveOrderToSupabase(order: Order, cashierProfileId: string): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    const isRealUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cashierProfileId);
    const validCashierId = isRealUUID ? cashierProfileId : null;

    let customerUUID = null;
    if (order.customerId) {
      const cleanCustId = order.customerId.replace('DL-', '');
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanCustId)) {
        customerUUID = cleanCustId;
      } else {
        // Query UUID by QR Code / DL Code
        const { data } = await supabase
          .from('customers')
          .select('id')
          .or(`qr_code.eq.CLUB-${order.customerId},qr_code.eq.${order.customerId}`)
          .maybeSingle();
        if (data?.id) customerUUID = data.id;
      }
    }

    // 1. Insert order record
    const { data: savedOrder, error: orderErr } = await supabase.from('orders').insert({
      id: order.id,
      folio: order.ticketNumber,
      ticket_number: order.ticketNumber,
      ticket_type: order.type === 'canje' ? 'Canje' : 'Venta',
      sales_channel: order.channel,
      customer_id: customerUUID,
      customer_display_name: order.customerName || null,
      platform_order_number: order.channel === 'UBER' || order.channel === 'DIDI' ? `ID-${Math.floor(Math.random() * 900000 + 100000)}` : null,
      status: order.status === 'pendiente' ? 'pending' : order.status === 'preparacion' ? 'preparing' : 'completed',
      total: order.total,
      discount: order.discount,
      points_earned: order.pointsGenerated,
      points_redeemed: order.pointsUsed,
      payment_method: order.paymentMethod.toUpperCase(),
      cashier_id: validCashierId,
      branch_id: DEFAULT_BRANCH_ID,
      created_at: order.createdAt
    }).select('id').single();

    if (orderErr) throw orderErr;
    if (!savedOrder) return;

    // 2. Insert items
    const itemPayloads = order.items.map(item => ({
      order_id: savedOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.priceUnit,
      total_price: item.subtotal
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemPayloads);
      if (itemsErr) { console.error('Supabase order_items insert error:', itemsErr); throw itemsErr; }
  } catch (error) {
    console.error('Error saving order transaction to Supabase:', error);
    throw error;
  }
}

export async function updateOrderStatusInSupabase(orderId: string, status: KdsStatus): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    const dbStatus = status === 'pendiente' ? 'pending' : status === 'preparacion' ? 'preparing' : 'completed';
    const updates: any = { status: dbStatus, updated_at: new Date().toISOString() };

    if (status === 'preparacion') {
      updates.kds_started_at = new Date().toISOString();
    } else if (status === 'listo') {
      updates.kds_completed_at = new Date().toISOString();
      
      // Calculate elapsed time
      const { data } = await supabase.from('orders').select('kds_started_at, created_at').eq('id', orderId).single();
      if (data) {
        const start = data.kds_started_at ? new Date(data.kds_started_at) : new Date(data.created_at);
        const elapsed = Math.floor((Date.now() - start.getTime()) / 1000);
        updates.kds_elapsed_seconds = elapsed;
      }
    }

    await supabase.from('orders').update(updates).eq('id', orderId);
  } catch (error) {
    console.warn('Error updating order status in Supabase:', error);
  }
}

/**
 * ==========================================
 * 6. AUDIT LOGGING SYNCHRONIZATION
 * ==========================================
 */

export async function loadAuditLogsFromSupabase(fallback: AuditLog[]): Promise<AuditLog[]> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!data) return fallback;

    return data.map(l => ({
      id: l.id,
      user: l.user_label,
      date: l.created_at.split('T')[0],
      time: l.created_at.split('T')[1]?.substring(0, 8) || '',
      action: l.action,
      previousValue: l.previous_value || 'N/A',
      newValue: l.new_value || 'N/A',
      module: l.module
    }));
  } catch (error) {
    console.warn('Error loading audit logs from Supabase:', error);
    return fallback;
  }
}

export async function saveAuditLogToSupabase(log: AuditLog, userId?: string, ipAddress?: string): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    await supabase.from('audit_logs').insert({
      id: log.id,
      user_label: log.user,
      user_id: userId || null,
      action: log.action,
      previous_value: log.previousValue,
      new_value: log.newValue,
      module: log.module,
      ip_address: ipAddress || '127.0.0.1',
      device_info: 'Navegador Web DelightOS',
      browser_info: navigator.userAgent,
      branch_id: DEFAULT_BRANCH_ID
    });
  } catch (error) {
    console.warn('Error creating audit log in Supabase:', error);
  }
}

/**
 * ==========================================
 * 7. USERS (PROFILES & SECURITY) SYNCHRONIZATION
 * ==========================================
 */

export function mapUserIdToUUID(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  const clean = id.replace('usr-', '');
  return `00000000-0000-0000-0000-${clean.padStart(12, '0')}`;
}

export async function loadUsersFromSupabase(fallback: User[]): Promise<User[]> {
  if (!isSupabaseActive || !supabase) return fallback;

  try {
    const { data: tConfig } = await supabase
      .from('ticket_config')
      .select('header_message')
      .eq('branch_id', DEFAULT_BRANCH_ID)
      .maybeSingle();

    if (tConfig?.header_message && tConfig.header_message.trim().startsWith('{')) {
      const parsed = JSON.parse(tConfig.header_message);
      if (parsed.users && Array.isArray(parsed.users)) {
        return parsed.users;
      }
    }
    
    // If not found in config, fallback to default mock list
    return fallback;
  } catch (error) {
    console.warn('Error loading users from Supabase:', error);
    return fallback;
  }
}

export async function saveUsersToSupabase(users: User[], config: SystemConfig): Promise<void> {
  if (!isSupabaseActive || !supabase) return;

  try {
    // 1. Save all users list inside the ticket config serialized JSON
    const updatedTicketConfig = {
      ...config.ticket,
      users: users // Save credentials securely inside serialized JSON
    };

    const printDestination = config.ticket.printSetting === 'ticket_only' ? 'Ticket' :
                             config.ticket.printSetting === 'kitchen_only' ? 'Cocina' :
                             config.ticket.printSetting === 'both' ? 'Ambos' : 'Solo KDS';

    await supabase.from('ticket_config').upsert({
      branch_id: DEFAULT_BRANCH_ID,
      business_name: config.ticket.businessName,
      paper_width: config.ticket.ticketSize,
      print_destination: printDestination,
      show_cashier: config.ticket.showCashier,
      header_message: JSON.stringify(updatedTicketConfig),
      footer_message: config.ticket.footerText
    });

    // 2. Sync each user with public.profiles table
    for (const u of users) {
      const userUUID = mapUserIdToUUID(u.id);
      const dbRole = u.role === UserRole.CASHIER ? 'cashier' :
                     u.role === UserRole.KITCHEN ? 'kitchen' : u.role;

      await supabase.from('profiles').upsert({
        id: userUUID,
        name: u.name,
        email: u.email,
        role: dbRole,
        branch_id: '00000000-0000-0000-0000-000000000001',
        status: u.active ? 'activo' : 'inactivo'
      });
    }
  } catch (error) {
    console.warn('Error saving users to Supabase:', error);
  }
}
