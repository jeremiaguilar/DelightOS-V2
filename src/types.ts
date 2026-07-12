/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cajero',
  KITCHEN = 'cocina',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export type ProductCategory = string;

export enum SalesChannel {
  MOSTRADOR = 'MOSTRADOR',
  UBER = 'UBER',
  DIDI = 'DIDI',
  ESPECIAL = 'ESPECIAL',
  ONLINE_FUTURE = 'ONLINE_FUTURE',
}

export interface ProductRecipeItem {
  ingredientId: string;
  quantity: number; // e.g. 150g, 1pz, 100ml
}

export interface ProductPrices {
  [SalesChannel.MOSTRADOR]: number;
  [SalesChannel.UBER]: number;
  [SalesChannel.DIDI]: number;
  [SalesChannel.ESPECIAL]: number; // automatically 15% off MOSTRADOR, does not generate points
  [SalesChannel.ONLINE_FUTURE]: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory; // Mapped to subCategory for backward compatibility or general category
  mainCategory?: string;
  subCategory?: string;
  family?: string;
  prices: ProductPrices;
  originalPrice?: number;
  discountPrice?: number;
  description?: string;
  image_url?: string;
  isAvailableToday?: boolean;
  recipe?: ProductRecipeItem[];
  image?: string;
  active: boolean;
  allowReward?: boolean;
  rewardPoints?: number;
  promotionText?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string; // 'g', 'ml', 'pz', 'kg', etc.
  minStock: number;
  active: boolean;
}

export interface Customer {
  id: string; // DL-XXXX format
  name: string;
  lastName: string;
  phone: string;
  birthdate: string; // YYYY-MM-DD
  qrCode: string; // text for QR
  registrationDate: string;
  lastPurchaseDate?: string;
  totalSpent: number;
  totalPurchases: number;
  pointsAccumulated: number;
  pointsRedeemed: number;
  pointsAvailable: number;
}

export type OrderType = 'venta' | 'canje';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'puntos' | 'plataforma';
export type KdsStatus = 'pendiente' | 'preparacion' | 'listo' | 'cancelado' | 'solicitado_cancelacion';

export interface ExtraItem {
  name: string;
  price: number;
}

export interface OrderItem {
  id: string; // unique item instance id
  productId: string;
  name: string;
  quantity: number;
  priceUnit: number;
  subtotal: number;
  extras: string[]; // names of extras like 'Philadelphia extra'
  extrasCost: number;
  selectedCubierto: 'Palillos' | 'Tenedor' | 'Ninguno';
  cubiertosCost: number;
  kitchenNotes?: string;
}

export interface Order {
  id: string;
  ticketNumber: string;
  type: OrderType;
  customerId?: string; // Optional reference to Club Delight customer
  customerName?: string; // Cache customer name
  channel: SalesChannel;
  items: OrderItem[];
  subtotal: number;
  discount: number; // 15% for ESPECIAL, etc.
  total: number;
  pointsGenerated: number; // Only on 'venta', not on ESPECIAL, $100 complete centenas = 1pt
  pointsUsed: number; // Only on 'canje'
  paymentMethod: PaymentMethod;
  status: KdsStatus;
  createdAt: string; // ISO string
  startedAt?: string; // ISO string when preparation starts
  completedAt?: string; // ISO string when ready
  elapsedSeconds?: number; // total time in KDS
  cashierId: string;
  cashierName: string;
  cancellationReason?: string;
}

export interface TicketConfig {
  logoText: string;
  businessName: string;
  address: string;
  phone: string;
  whatsapp: string;
  footerText: string;
  showTax: boolean;
  showCashier: boolean;
  showPointsInfo: boolean;
  taxPercent: number;
  ticketSize: '58mm' | '80mm';
  copies: number;
  printSetting: 'ticket_only' | 'kitchen_only' | 'both' | 'no_kitchen_kds_only';
  instagram?: string;
  fiscalInfo?: string;
  logoUrl?: string;
}

export interface KdsSoundConfig {
  newOrder: boolean;
  upcomingExpiry: boolean; // under 3 minutes left
  delayed: boolean; // over 18 minutes
  ready: boolean;
}

export interface SystemConfig {
  ticket: TicketConfig;
  sounds: KdsSoundConfig;
}

export interface AuditLog {
  id: string;
  user: string;
  date: string;
  time: string;
  action: string;
  previousValue: string;
  newValue: string;
  module: string;
}

export interface Reward {
  id: string;
  name: string;
  points: number;
  category: string;
  active: boolean;
}

export interface CashRegister {
  id: string;
  branch_id: string;
  opened_by: string;
  opened_at: string;
  initial_cash: number;
  status: 'OPEN' | 'CLOSED';
  closed_at?: string;
  closed_by?: string;
  expected_cash?: number;
  actual_cash?: number;
  cash_difference?: number;
  notes?: string;
}

export interface CashMovement {
  id: string;
  register_id: string;
  type: 'IN' | 'OUT';
  amount: number;
  reason: string;
  user_id: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  ingredient_id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  provider?: string;
  invoice_number?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}
