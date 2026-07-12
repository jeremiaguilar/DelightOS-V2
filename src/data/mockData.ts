/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Product,
  ProductCategory,
  SalesChannel,
  Ingredient,
  Customer,
  SystemConfig,
  User,
  UserRole
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Administrador Delight',
    email: 'delightdrinks213@gmail.com',
    role: UserRole.ADMIN,
    active: true,
  },
  {
    id: 'usr-2',
    name: 'Cajero Principal',
    email: 'cajero@delight.com',
    role: UserRole.CASHIER,
    active: true,
  },
  {
    id: 'usr-3',
    name: 'Chef Ejecutivo',
    email: 'cocina@delight.com',
    role: UserRole.KITCHEN,
    active: true,
  }
];

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-1', name: 'Arroz de Sushi', stock: 12500, unit: 'g', minStock: 3000, active: true },
  { id: 'ing-2', name: 'Alga Nori (Hojas)', stock: 150, unit: 'pz', minStock: 30, active: true },
  { id: 'ing-3', name: 'Salmón Fresco Premium', stock: 4500, unit: 'g', minStock: 1000, active: true },
  { id: 'ing-4', name: 'Camarón Mediano', stock: 6000, unit: 'g', minStock: 1500, active: true },
  { id: 'ing-5', name: 'Pollo Pechuga Deshebrada', stock: 8000, unit: 'g', minStock: 2000, active: true },
  { id: 'ing-6', name: 'Queso Crema Philadelphia', stock: 5000, unit: 'g', minStock: 1000, active: true },
  { id: 'ing-7', name: 'Aguacate Hass', stock: 4000, unit: 'g', minStock: 1200, active: true },
  { id: 'ing-8', name: 'Pepino Europeo', stock: 5000, unit: 'g', minStock: 1000, active: true },
  { id: 'ing-9', name: 'Panko Japonés', stock: 3500, unit: 'g', minStock: 800, active: true },
  { id: 'ing-10', name: 'Vaso Delight 16oz', stock: 500, unit: 'pz', minStock: 100, active: true },
  { id: 'ing-11', name: 'Tapa Domo', stock: 480, unit: 'pz', minStock: 100, active: true },
  { id: 'ing-12', name: 'Concentrado de Mango', stock: 10000, unit: 'ml', minStock: 2000, active: true },
  { id: 'ing-13', name: 'Café de Especialidad Grano', stock: 7000, unit: 'g', minStock: 1500, active: true },
  { id: 'ing-14', name: 'Leche Entera Cremosa', stock: 24000, unit: 'ml', minStock: 6000, active: true },
  { id: 'ing-15', name: 'Jarabe Endulzante Orgánico', stock: 8000, unit: 'ml', minStock: 1500, active: true },
  { id: 'ing-16', name: 'Charola para Sushi y Cubierta', stock: 300, unit: 'pz', minStock: 50, active: true },
  { id: 'ing-17', name: 'Aderezo Chipotle Creamy', stock: 3000, unit: 'ml', minStock: 500, active: true },
  { id: 'ing-18', name: 'Salsa de Soya Artesanal', stock: 5000, unit: 'ml', minStock: 1000, active: true }
];

export const INITIAL_PRODUCTS: Product[] = [
  // Makis Naturales
  {
    id: 'prod-1',
    name: 'Maki Natural de Salmón',
    category: "Makis",
    prices: {
      [SalesChannel.MOSTRADOR]: 145,
      [SalesChannel.UBER]: 175,
      [SalesChannel.DIDI]: 169,
      [SalesChannel.ESPECIAL]: 123.25,
      [SalesChannel.ONLINE_FUTURE]: 145
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 150 }, // 150g arroz
      { ingredientId: 'ing-2', quantity: 1 },   // 1 pz alga nori
      { ingredientId: 'ing-3', quantity: 50 },  // 50g salmón
      { ingredientId: 'ing-6', quantity: 20 },  // 20g philadelphia
      { ingredientId: 'ing-7', quantity: 20 },  // 20g aguacate
      { ingredientId: 'ing-8', quantity: 15 },  // 15g pepino
      { ingredientId: 'ing-16', quantity: 1 }   // 1 charola
    ],
    active: true
  },
  {
    id: 'prod-2',
    name: 'Maki Natural de Atún',
    category: "Makis",
    prices: {
      [SalesChannel.MOSTRADOR]: 140,
      [SalesChannel.UBER]: 170,
      [SalesChannel.DIDI]: 165,
      [SalesChannel.ESPECIAL]: 119,
      [SalesChannel.ONLINE_FUTURE]: 140
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 150 },
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-6', quantity: 20 },
      { ingredientId: 'ing-7', quantity: 20 },
      { ingredientId: 'ing-8', quantity: 15 },
      { ingredientId: 'ing-16', quantity: 1 }
    ],
    active: true
  },

  // Makis Empanizados
  {
    id: 'prod-3',
    name: 'Maki Empanizado Pollo Crunchy',
    category: "Makis",
    prices: {
      [SalesChannel.MOSTRADOR]: 155,
      [SalesChannel.UBER]: 185,
      [SalesChannel.DIDI]: 179,
      [SalesChannel.ESPECIAL]: 131.75,
      [SalesChannel.ONLINE_FUTURE]: 155
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 150 },
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-5', quantity: 60 },  // 60g pollo
      { ingredientId: 'ing-6', quantity: 20 },
      { ingredientId: 'ing-7', quantity: 20 },
      { ingredientId: 'ing-9', quantity: 30 },  // 30g panko
      { ingredientId: 'ing-16', quantity: 1 }
    ],
    active: true
  },
  {
    id: 'prod-4',
    name: 'Maki Empanizado de Camarón',
    category: "Makis",
    prices: {
      [SalesChannel.MOSTRADOR]: 165,
      [SalesChannel.UBER]: 195,
      [SalesChannel.DIDI]: 189,
      [SalesChannel.ESPECIAL]: 140.25,
      [SalesChannel.ONLINE_FUTURE]: 165
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 150 },
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 50 },  // 50g camarón
      { ingredientId: 'ing-6', quantity: 20 },
      { ingredientId: 'ing-7', quantity: 20 },
      { ingredientId: 'ing-9', quantity: 30 },
      { ingredientId: 'ing-16', quantity: 1 }
    ],
    active: true
  },

  // Makis Queso
  {
    id: 'prod-5',
    name: 'Maki Filadelfia Especial',
    category: "Makis",
    prices: {
      [SalesChannel.MOSTRADOR]: 160,
      [SalesChannel.UBER]: 190,
      [SalesChannel.DIDI]: 185,
      [SalesChannel.ESPECIAL]: 136,
      [SalesChannel.ONLINE_FUTURE]: 160
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 150 },
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-6', quantity: 60 },  // 60g queso crema envuelto completo
      { ingredientId: 'ing-3', quantity: 30 },  // 30g salmón
      { ingredientId: 'ing-7', quantity: 20 },
      { ingredientId: 'ing-16', quantity: 1 }
    ],
    active: true
  },

  // Sushiburger
  {
    id: 'prod-6',
    name: 'Sushiburger Original de Salmón',
    category: "Sushiburger",
    prices: {
      [SalesChannel.MOSTRADOR]: 185,
      [SalesChannel.UBER]: 220,
      [SalesChannel.DIDI]: 215,
      [SalesChannel.ESPECIAL]: 157.25,
      [SalesChannel.ONLINE_FUTURE]: 185
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 200 },  // 200g arroz
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 70 },   // 70g salmón
      { ingredientId: 'ing-6', quantity: 30 },
      { ingredientId: 'ing-7', quantity: 30 },
      { ingredientId: 'ing-16', quantity: 1 }
    ],
    active: true
  },
  {
    id: 'prod-7',
    name: 'Sushiburger Res & Tocino',
    category: "Sushiburger",
    prices: {
      [SalesChannel.MOSTRADOR]: 180,
      [SalesChannel.UBER]: 215,
      [SalesChannel.DIDI]: 210,
      [SalesChannel.ESPECIAL]: 153,
      [SalesChannel.ONLINE_FUTURE]: 180
    },
    recipe: [
      { ingredientId: 'ing-1', quantity: 200 },
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-6', quantity: 30 },
      { ingredientId: 'ing-7', quantity: 30 },
      { ingredientId: 'ing-16', quantity: 1 }
    ],
    active: true
  },

  // Frappés
  {
    id: 'prod-8',
    name: 'Frappé Clásico de Café Caramel',
    category: "Frappés",
    prices: {
      [SalesChannel.MOSTRADOR]: 75,
      [SalesChannel.UBER]: 95,
      [SalesChannel.DIDI]: 90,
      [SalesChannel.ESPECIAL]: 63.75,
      [SalesChannel.ONLINE_FUTURE]: 75
    },
    recipe: [
      { ingredientId: 'ing-10', quantity: 1 },   // Vaso 16oz
      { ingredientId: 'ing-11', quantity: 1 },   // Tapa Domo
      { ingredientId: 'ing-13', quantity: 18 },  // 18g café
      { ingredientId: 'ing-14', quantity: 220 }, // Leche
      { ingredientId: 'ing-15', quantity: 30 }   // Jarabe
    ],
    active: true
  },
  {
    id: 'prod-9',
    name: 'Frappé Oreo Delight Premium',
    category: "Frappés",
    prices: {
      [SalesChannel.MOSTRADOR]: 85,
      [SalesChannel.UBER]: 105,
      [SalesChannel.DIDI]: 99,
      [SalesChannel.ESPECIAL]: 72.25,
      [SalesChannel.ONLINE_FUTURE]: 85
    },
    recipe: [
      { ingredientId: 'ing-10', quantity: 1 },
      { ingredientId: 'ing-11', quantity: 1 },
      { ingredientId: 'ing-14', quantity: 220 },
      { ingredientId: 'ing-15', quantity: 40 }
    ],
    active: true
  },

  // Smoothies
  {
    id: 'prod-10',
    name: 'Smoothie Mango Habanero Tropical',
    category: "Smoothies",
    prices: {
      [SalesChannel.MOSTRADOR]: 80,
      [SalesChannel.UBER]: 100,
      [SalesChannel.DIDI]: 95,
      [SalesChannel.ESPECIAL]: 68,
      [SalesChannel.ONLINE_FUTURE]: 80
    },
    recipe: [
      { ingredientId: 'ing-10', quantity: 1 },
      { ingredientId: 'ing-11', quantity: 1 },
      { ingredientId: 'ing-12', quantity: 120 }, // 120ml concentrado mango
      { ingredientId: 'ing-15', quantity: 20 }
    ],
    active: true
  },

  // Café
  {
    id: 'prod-11',
    name: 'Capuccino Italiano de Especialidad',
    category: "Café",
    prices: {
      [SalesChannel.MOSTRADOR]: 55,
      [SalesChannel.UBER]: 75,
      [SalesChannel.DIDI]: 70,
      [SalesChannel.ESPECIAL]: 46.75,
      [SalesChannel.ONLINE_FUTURE]: 55
    },
    recipe: [
      { ingredientId: 'ing-10', quantity: 1 },
      { ingredientId: 'ing-11', quantity: 1 },
      { ingredientId: 'ing-13', quantity: 15 },
      { ingredientId: 'ing-14', quantity: 250 }
    ],
    active: true
  },
  {
    id: 'prod-12',
    name: 'Americano Selecto',
    category: "Café",
    prices: {
      [SalesChannel.MOSTRADOR]: 45,
      [SalesChannel.UBER]: 65,
      [SalesChannel.DIDI]: 60,
      [SalesChannel.ESPECIAL]: 38.25,
      [SalesChannel.ONLINE_FUTURE]: 45
    },
    recipe: [
      { ingredientId: 'ing-10', quantity: 1 },
      { ingredientId: 'ing-11', quantity: 1 },
      { ingredientId: 'ing-13', quantity: 15 }
    ],
    active: true
  }
];

export const DELIGHT_EXTRAS = [
  { name: 'Soya Picante', price: 10 },
  { name: 'Salsa Dulce Mango Habanero', price: 12 },
  { name: 'Aderezo adicional', price: 15 },
  { name: 'Philadelphia extra', price: 20 },
  { name: 'Aguacate extra', price: 20 },
  { name: 'Proteína extra', price: 35 }
];

export const DELIGHT_CUBIERTOS = [
  { name: 'Palillos', price: 2 },
  { name: 'Tenedor', price: 0 },
  { name: 'Ninguno', price: 0 }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'DL-0102',
    name: 'Juan Carlos',
    lastName: 'López Ramos',
    phone: '5512345678',
    birthdate: '1992-05-15',
    qrCode: 'CLUB-DL-0102',
    registrationDate: '2025-01-10',
    lastPurchaseDate: '2026-07-06',
    totalSpent: 4500,
    totalPurchases: 18,
    pointsAccumulated: 45,
    pointsRedeemed: 20, // Redeemed 1 frappé
    pointsAvailable: 25
  },
  {
    id: 'DL-0103',
    name: 'María Fernanda',
    lastName: 'Gómez Díaz',
    phone: '5523456789',
    birthdate: '1995-10-22',
    qrCode: 'CLUB-DL-0103',
    registrationDate: '2025-02-14',
    lastPurchaseDate: '2026-07-07',
    totalSpent: 1800,
    totalPurchases: 8,
    pointsAccumulated: 18,
    pointsRedeemed: 0,
    pointsAvailable: 18
  },
  {
    id: 'DL-0104',
    name: 'Alejandro',
    lastName: 'Ramírez Ortiz',
    phone: '5534567890',
    birthdate: '1988-03-08',
    qrCode: 'CLUB-DL-0104',
    registrationDate: '2025-03-01',
    lastPurchaseDate: '2026-07-05',
    totalSpent: 6200,
    totalPurchases: 24,
    pointsAccumulated: 62,
    pointsRedeemed: 40, // Redeemed sushiburger or multiple
    pointsAvailable: 22
  },
  {
    id: 'DL-0105',
    name: 'Sofía',
    lastName: 'Valenzuela Meza',
    phone: '5545678901',
    birthdate: '1999-12-01',
    qrCode: 'CLUB-DL-0105',
    registrationDate: '2025-04-18',
    lastPurchaseDate: '2026-06-30',
    totalSpent: 3000,
    totalPurchases: 12,
    pointsAccumulated: 30,
    pointsRedeemed: 15, // Redeemed Café
    pointsAvailable: 15
  },
  {
    id: 'DL-0106',
    name: 'Ricardo',
    lastName: 'Treviño Cantú',
    phone: '5556789012',
    birthdate: '1994-07-14',
    qrCode: 'CLUB-DL-0106',
    registrationDate: '2025-06-05',
    lastPurchaseDate: '2026-07-07',
    totalSpent: 900,
    totalPurchases: 4,
    pointsAccumulated: 9,
    pointsRedeemed: 0,
    pointsAvailable: 9
  }
];

export const INITIAL_CONFIG: SystemConfig = {
  ticket: {
    logoText: '🍧🍹',
    businessName: 'Delight Frappés & Drinks',
    address: 'Av. Principal #452, Col. Delicias',
    phone: '81-2244-5566',
    whatsapp: '81-9988-7766',
    footerText: '¡Gracias por tu preferencia!\nSiguenos en redes: @delightfrappes\nEste no es un comprobante fiscal.',
    showTax: false,
    showCashier: true,
    showPointsInfo: true,
    taxPercent: 16,
    ticketSize: '80mm',
    copies: 1,
    printSetting: 'both'
  },
  sounds: {
    newOrder: true,
    upcomingExpiry: true,
    delayed: true,
    ready: true
  }
};

export const REWARDS_CATALOG = [
  { name: 'Extra', points: 5, category: 'Extras' },
  { name: 'Café', points: 20, category: 'Café' },
  { name: 'Frappé', points: 20, category: 'Frappés' },
  { name: 'Smoothie', points: 20, category: 'Smoothies' },
  { name: 'Maki Natural', points: 40, category: 'Makis Naturales' },
  { name: 'Maki Empanizado', points: 45, category: 'Makis Empanizados' },
  { name: 'Maki Queso', points: 40, category: 'Makis Queso' },
  { name: 'Sushiburger', points: 50, category: 'Sushiburger' }
];
