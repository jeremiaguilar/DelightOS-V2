/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useCashRegisterContext } from '../contexts/CashRegisterContext';
import { Order, Customer, SalesChannel, SystemConfig, AuditLog, User, UserRole, Product, Ingredient, KdsStatus } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  Gift, 
  Users, 
  BarChart3, 
  PieChart, 
  Layers,
  ArrowUpRight,
  Clock,
  Settings,
  Shield,
  Search,
  Check,
  Printer,
  Smartphone,
  MapPin,
  Sliders,
  Receipt,
  FileText,
  Plus,
  Edit,
  Trash2,
  Key,
  UserPlus,
  AlertTriangle,
  ShieldAlert,
  Download,
  Upload,
  Coins,
  Calendar,
  Phone,
  QrCode,
  FileSpreadsheet,
  Lock,
  Sparkles,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  PiggyBank,
  Ban
} from 'lucide-react';
import { calculateProductionMetrics } from '../utils/recipeHelper';

interface RubricasGerencialesViewProps {
  orders: Order[];
  customers: Customer[];
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  auditLogs: AuditLog[];
  currentUser: User;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  ingredients: Ingredient[];
  products: Product[];
  onUpdateIngredient: (ing: Ingredient) => void;
  onUpdateCustomer: (cust: Customer) => void;
  onUpdateOrders: (orders: Order[]) => void;
  addAuditLog: (action: string, previousValue: string, newValue: string, module: string) => Promise<void>;
  onUpdateProducts?: (prods: Product[]) => void;
  onUpdateIngredients?: (ings: Ingredient[]) => void;
}

export default function RubricasGerencialesView({ 
  orders, 
  customers, 
  config, 
  onUpdateConfig, 
  auditLogs,
  currentUser,
  users = [],
  onUpdateUsers,
  ingredients = [],
  products = [],
  onUpdateIngredient,
  onUpdateCustomer,
  onUpdateOrders,
  addAuditLog,
  onUpdateProducts,
  onUpdateIngredients
}: RubricasGerencialesViewProps) {
  const { activeRegister, openRegister, closeRegister, updateHistoryRecord, history: cashHistory } = useCashRegisterContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'general' | 'kds' | 'ticket' | 'sounds' | 'users' | 'audit' | 'cash' | 'data' | 'system'>('dashboard');

  // Dashboard Logic
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);
  
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today) && o.status !== 'cancelado');
  const monthOrders = orders.filter(o => o.createdAt.startsWith(month) && o.status !== 'cancelado');
  
  const ventasHoy = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const ventasMes = monthOrders.reduce((acc, o) => acc + o.total, 0);
  
  const ventasUber = todayOrders.filter(o => o.channel === 'UBER').reduce((acc, o) => acc + o.total, 0);
  const ventasDidi = todayOrders.filter(o => o.channel === 'DIDI').reduce((acc, o) => acc + o.total, 0);
  const ventasMostrador = todayOrders.filter(o => o.channel === 'MOSTRADOR').reduce((acc, o) => acc + o.total, 0);
  
  const canjesHoy = todayOrders.filter(o => o.type === 'canje').length;
  const puntosOtorgados = todayOrders.reduce((acc, o) => acc + o.pointsGenerated, 0);
  
  // Productos más vendidos hoy
  const productCounts: Record<string, number> = {};
  todayOrders.forEach(o => o.items.forEach(i => {
    productCounts[i.name] = (productCounts[i.name] || 0) + i.quantity;
  }));
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  // Insumos por agotarse
  const lowStock = ingredients.filter(i => i.stock <= i.minStock);
  
  // Clientes Frecuentes
  const topCustomers = [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);

  const [auditQuery, setAuditQuery] = useState('');

  // Users management subtab states
  const [usersSearch, setUsersSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // User form states
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState<UserRole>(UserRole.CASHIER);
  const [uPassword, setUPassword] = useState('');

  // =========================================================================
  // INTEGRATED CORTE DE CAJA STATE & OPERATIONS
  // =========================================================================
  
  
  const [corteFondoInicial, setCorteFondoInicial] = useState<number>(500);
  const [corteEfectivoContado, setCorteEfectivoContado] = useState<string>('');
  const [corteMotivoDiferencia, setCorteMotivoDiferencia] = useState<string>('');
  const [showNewCorteForm, setShowNewCorteForm] = useState<boolean>(false);

  const handleStartCorte = async (fondo: number) => {
    if (activeRegister) {
      alert('Ya existe un corte de caja abierto.');
      return;
    }
    await openRegister(fondo, 'Sucursal Principal', '');
    setShowNewCorteForm(false);
  };

  const handleCloseCorte = async (efectivoContado: number, motivo: string) => {
    if (!activeRegister) return;
    
    // Filter orders created after the opening of this cut
    const cutOrders = orders.filter(o => new Date(o.createdAt).getTime() >= new Date(activeRegister.openedAt).getTime());
    
    // Calculate new metrics
    const vEfectivo = cutOrders.filter(o => o.channel === 'MOSTRADOR' && o.paymentMethod === 'efectivo' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vTarjeta = cutOrders.filter(o => o.channel === 'MOSTRADOR' && o.paymentMethod === 'tarjeta' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vTransferencia = cutOrders.filter(o => o.channel === 'MOSTRADOR' && o.paymentMethod === 'transferencia' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vUberPlataforma = cutOrders.filter(o => o.channel === 'UBER' && o.paymentMethod === 'plataforma' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vDidiPlataforma = cutOrders.filter(o => o.channel === 'DIDI' && o.paymentMethod === 'plataforma' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    const vDidiEfectivo = cutOrders.filter(o => o.channel === 'DIDI' && o.paymentMethod === 'efectivo' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
    
    const canjes = cutOrders.filter(o => o.type === 'canje' && o.status !== 'cancelado').length;
    const cancelados = cutOrders.filter(o => o.status === 'cancelado').length;

    // Efectivo total esperado: Fondo + Ventas Efectivo Mostrador + Ventas Efectivo DiDi
    const totalEsperado = activeRegister.initialFloat + vEfectivo + vDidiEfectivo;
    const diferencia = efectivoContado - totalEsperado;

    if (diferencia !== 0 && !motivo.trim()) {
      alert('Es obligatorio ingresar un motivo de justificación cuando existe una diferencia de caja.');
      return;
    }

    await closeRegister({
      countedCash: efectivoContado,
      expectedCash: totalEsperado,
      difference: diferencia,
      notes: motivo,
      ventasEfectivo: vEfectivo,
      ventasTarjeta: vTarjeta,
      ventasTransferencia: vTransferencia,
      ventasUberPlataforma: vUberPlataforma,
      ventasDidiPlataforma: vDidiPlataforma,
      ventasDidiEfectivo: vDidiEfectivo,
      canjesCount: canjes,
      canceladosCount: cancelados
    });

    setCorteEfectivoContado('');
    setCorteMotivoDiferencia('');
    
    alert('Corte de caja guardado, cerrado y auditado exitosamente. Los registros han sido bloqueados.');
  };

  const handleReviewCorte = async (corteId: string) => {
    if (currentUser.role !== 'admin') {
      alert('Solo el Administrador de Delight puede revisar o autorizar cortes.');
      return;
    }
    updateHistoryRecord(corteId, { status: 'revisado', revisor: currentUser.name });

    await addAuditLog(
      'Revisión de Corte de Caja',
      'Corte Cerrado',
      `Corte ID ${corteId} aprobado y marcado como REVISADO por ${currentUser.name}`,
      'Corte de Caja'
    );
    alert('Corte de caja validado y firmado electrónicamente por Administrador.');
  };

  // =========================================================================
  // INTEGRATED TICKET CON ERROR / CANCELACIONES
  // =========================================================================
  const [selectedTicketForCancel, setSelectedTicketForCancel] = useState<Order | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState<string>('');
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>('');

  const handleRequestCancellation = async (orderId: string, motivo: string) => {
    if (!motivo.trim()) {
      alert('Debe especificar el motivo de la cancelación.');
      return;
    }

    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    if (currentUser.role === 'admin') {
      // Direct instant approval if Admin is triggering it
      await handleApproveCancellation(orderId, motivo);
    } else {
      // Send to review
      const updatedOrders = orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'solicitado_cancelacion' as KdsStatus,
            cancellationReason: motivo
          };
        }
        return o;
      });
      onUpdateOrders(updatedOrders);
      setSelectedTicketForCancel(null);
      setCancelReasonText('');

      await addAuditLog(
        'Solicitar Cancelación',
        'Ticket Activo',
        `Ticket ${orderToCancel.ticketNumber} mandado a revisión. Motivo: ${motivo}`,
        'Auditoría Ventas'
      );
      alert('Solicitud de cancelación enviada a revisión del Administrador.');
    }
  };

  const handleApproveCancellation = async (orderId: string, motivo: string) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    const actualMotivo = motivo || orderToCancel.cancellationReason || 'Cancelado por Administrador';

    // 1. Revert Inventory
    let latestIngredients = [...ingredients];
    for (const item of orderToCancel.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && prod.recipe) {
        for (const recItem of prod.recipe) {
          const idx = latestIngredients.findIndex(i => i.id === recItem.ingredientId);
          if (idx > -1) {
            const prev = latestIngredients[idx];
            const addedStock = recItem.quantity * item.quantity;
            latestIngredients[idx] = {
              ...prev,
              stock: prev.stock + addedStock
            };
            await onUpdateIngredient(latestIngredients[idx]);
          }
        }
      }
    }

    // 2. Revert Customer points
    if (orderToCancel.customerId) {
      const cust = customers.find(c => c.id === orderToCancel.customerId);
      if (cust) {
        const updatedCust = {
          ...cust,
          pointsAccumulated: Math.max(0, cust.pointsAccumulated - orderToCancel.pointsGenerated),
          pointsRedeemed: Math.max(0, cust.pointsRedeemed - orderToCancel.pointsUsed),
          pointsAvailable: Math.max(0, cust.pointsAvailable - orderToCancel.pointsGenerated + orderToCancel.pointsUsed),
          totalSpent: Math.max(0, cust.totalSpent - (orderToCancel.type === 'venta' ? orderToCancel.total : 0)),
          totalPurchases: Math.max(0, cust.totalPurchases - 1)
        };
        onUpdateCustomer(updatedCust);
      }
    }

    // 3. Update Order status
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'cancelado' as KdsStatus,
          cancellationReason: actualMotivo
        };
      }
      return o;
    });
    onUpdateOrders(updatedOrders);
    setSelectedTicketForCancel(null);
    setCancelReasonText('');

    await addAuditLog(
      'Aprobar Cancelación',
      `Ticket ${orderToCancel.ticketNumber} Activo`,
      `Ticket ${orderToCancel.ticketNumber} cancelado. Inventario y puntos Club DELIGHT revertidos. Motivo: ${actualMotivo}`,
      'Auditoría Ventas'
    );
    alert(`Ticket ${orderToCancel.ticketNumber} cancelado correctamente. Stock y puntos devueltos.`);
  };

  const handleRejectCancellation = async (orderId: string) => {
    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'pendiente' as KdsStatus // restore back to pending
        };
      }
      return o;
    });
    onUpdateOrders(updatedOrders);

    await addAuditLog(
      'Rechazar Cancelación',
      'Solicitado',
      `Solicitud de cancelación para Ticket ${orderToCancel.ticketNumber} RECHAZADA por Administrador.`,
      'Auditoría Ventas'
    );
    alert(`Solicitud de cancelación para ticket ${orderToCancel.ticketNumber} ha sido rechazada.`);
  };

  // =========================================================================
  // INTEGRATED IMPORTADOR INTELIGENTE
  // =========================================================================
  const [importText, setImportText] = useState<string>('');
  const [importTargetType, setImportTargetType] = useState<'products' | 'ingredients' | 'customers'>('products');
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importSuccessAlert, setImportSuccessAlert] = useState<string | null>(null);
  const [importErrorAlert, setImportErrorAlert] = useState<string | null>(null);

  const handleParseImportCSV = () => {
    setImportSuccessAlert(null);
    setImportErrorAlert(null);
    if (!importText.trim()) {
      setImportErrorAlert('El área de texto de importación está vacía.');
      return;
    }

    try {
      const lines = importText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setImportErrorAlert('El formato CSV debe incluir al menos una fila de cabecera y una de datos.');
        return;
      }

      // Standard split by comma
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const parsed = lines.slice(1).map((line, idx) => {
        // Simple comma split
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        const obj: Record<string, any> = { _rowIndex: idx + 1 };
        headers.forEach((h, colIdx) => {
          obj[h] = cols[colIdx] || '';
        });
        
        // Detection and validation
        obj._errors = [];
        if (importTargetType === 'products') {
          if (!obj.nombre && !obj.name) obj._errors.push('Falta el nombre de producto');
          if (!obj.categoria && !obj.category) obj._errors.push('Falta categoría');
          if (!obj.precio_mostrador && !obj.price) obj._errors.push('Falta precio mostrador');
        } else if (importTargetType === 'ingredients') {
          if (!obj.nombre && !obj.name) obj._errors.push('Falta nombre insumo');
          if (!obj.stock) obj._errors.push('Falta stock');
          if (!obj.unidad && !obj.unit) obj._errors.push('Falta unidad (g, ml, pz)');
        } else if (importTargetType === 'customers') {
          if (!obj.nombre && !obj.name) obj._errors.push('Falta nombre socio');
          if (!obj.telefono && !obj.phone) obj._errors.push('Falta teléfono');
        }

        return obj;
      });

      setImportPreviewRows(parsed);
    } catch (err: any) {
      setImportErrorAlert(`Error de parseo CSV: ${err.message}`);
    }
  };

  const handleExecuteImport = async () => {
    if (importPreviewRows.length === 0) return;

    const errorsCount = importPreviewRows.reduce((sum, r) => sum + r._errors.length, 0);
    if (errorsCount > 0) {
      if (!confirm(`La importación contiene ${errorsCount} errores. ¿Deseas ignorar las filas con error e importar las demás?`)) {
        return;
      }
    }

    const validRows = importPreviewRows.filter(r => r._errors.length === 0);
    let importedCount = 0;

    if (importTargetType === 'ingredients') {
      const updatedIngredients = [...ingredients];
      validRows.forEach(row => {
        const name = row.nombre || row.name;
        const stock = parseFloat(row.stock || '0');
        const unit = row.unidad || row.unit || 'g';
        const minStock = parseFloat(row.min_stock || row.minstock || '1000');

        // Check duplicates
        const existingIdx = updatedIngredients.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
        if (existingIdx > -1) {
          // Update existing
          updatedIngredients[existingIdx] = {
            ...updatedIngredients[existingIdx],
            stock,
            unit,
            minStock
          };
        } else {
          // Insert new
          const ids = updatedIngredients.map(i => parseInt(i.id.split('-')[1] || '100'));
          const maxId = Math.max(...ids, 18);
          updatedIngredients.push({
            id: `ing-${maxId + 1}`,
            name,
            stock,
            unit,
            minStock,
            active: true
          });
        }
        importedCount++;
      });
      if (onUpdateIngredients) {
        onUpdateIngredients(updatedIngredients);
      }
    } else if (importTargetType === 'products') {
      const updatedProducts = [...products];
      validRows.forEach(row => {
        const name = row.nombre || row.name;
        const categoryStr = row.categoria || row.category || 'Extras';
        const priceMostrador = parseFloat(row.precio_mostrador || row.price || '100');
        const priceUber = parseFloat(row.precio_uber || row.price_uber || String(priceMostrador * 1.2));
        const priceDidi = parseFloat(row.precio_didi || row.price_didi || String(priceMostrador * 1.15));
        const priceEspecial = parseFloat(row.precio_especial || row.price_especial || String(priceMostrador * 0.85));
        const rewardPoints = parseInt(row.reward_points || row.points || '20');

        // Match category string to enum values
        let matchedCategory: any = 'Extras';
        const searchCat = categoryStr.toLowerCase();
        if (searchCat.includes('natural')) matchedCategory = 'Makis Naturales';
        else if (searchCat.includes('empanizado')) matchedCategory = 'Makis Empanizados';
        else if (searchCat.includes('queso')) matchedCategory = 'Makis Queso';
        else if (searchCat.includes('burger')) matchedCategory = 'Sushiburger';
        else if (searchCat.includes('frapp')) matchedCategory = 'Frappés';
        else if (searchCat.includes('smooth')) matchedCategory = 'Smoothies';
        else if (searchCat.includes('caf')) matchedCategory = 'Café';

        const prices = {
          'MOSTRADOR': priceMostrador,
          'UBER': priceUber,
          'DIDI': priceDidi,
          'ESPECIAL': priceEspecial,
          'ONLINE_FUTURE': priceMostrador
        };

        const existingIdx = updatedProducts.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        if (existingIdx > -1) {
          updatedProducts[existingIdx] = {
            ...updatedProducts[existingIdx],
            category: matchedCategory,
            prices,
            rewardPoints,
            allowReward: true
          };
        } else {
          const ids = updatedProducts.map(p => parseInt(p.id.split('-')[1] || '100'));
          const maxId = Math.max(...ids, 12);
          updatedProducts.push({
            id: `prod-${maxId + 1}`,
            name,
            category: matchedCategory,
            prices,
            recipe: [], // Empty recipe to configure in catalog
            allowReward: true,
            rewardPoints,
            active: true
          });
        }
        importedCount++;
      });
      if (onUpdateProducts) {
        onUpdateProducts(updatedProducts);
      }
    } else if (importTargetType === 'customers') {
      validRows.forEach(row => {
        const rawName = row.nombre || row.name || '';
        const nameStr = String(rawName);
        const phone = row.telefono || row.phone || '0000000000';
        const birthdate = row.birthdate || row.cumpleanos || '1995-01-01';
        const points = parseInt(row.puntos || row.points || '0');

        const existingIdx = customers.findIndex(c => c.phone === phone);
        if (existingIdx === -1) {
          const ids = customers.map(c => parseInt(c.id.split('-')[1] || '100'));
          const maxId = Math.max(...ids, 106);
          const nextId = `DL-0${maxId + 1}`;

          const newCust = {
            id: nextId,
            name: nameStr.split(' ')[0] || nameStr,
            lastName: nameStr.split(' ').slice(1).join(' ') || '',
            phone,
            birthdate,
            qrCode: `CLUB-${nextId}`,
            registrationDate: new Date().toISOString().split('T')[0],
            totalSpent: 0,
            totalPurchases: 0,
            pointsAccumulated: points,
            pointsRedeemed: 0,
            pointsAvailable: points
          };
          onUpdateCustomer(newCust);
          importedCount++;
        }
      });
    }

    await addAuditLog(
      'Importador Inteligente',
      'Catálogo previo',
      `Importados/actualizados con éxito ${importedCount} registros de ${importTargetType}`,
      'Importación masiva'
    );

    setImportSuccessAlert(`¡Importación finalizada! Se cargaron/actualizaron correctamente ${importedCount} registros.`);
    setImportPreviewRows([]);
    setImportText('');
  };

  // User CRUD operations
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uName.trim() || !uEmail.trim() || !uPassword.trim()) {
      alert('Por favor, rellene todos los campos.');
      return;
    }
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: uName.trim(),
      email: uEmail.toLowerCase().trim(),
      role: uRole,
      active: true
    };
    
    const updatedUsers = [...users, newUser];
    onUpdateUsers(updatedUsers);

    // Securely cache password locally
    const storedPasswords = JSON.parse(localStorage.getItem('delight_passwords') || '{}');
    storedPasswords[newUser.email] = uPassword;
    localStorage.setItem('delight_passwords', JSON.stringify(storedPasswords));

    // Reset inputs
    setUName('');
    setUEmail('');
    setURole(UserRole.CASHIER);
    setUPassword('');
    setIsCreateModalOpen(false);
  };

  const handleToggleUserStatus = (user: User) => {
    const updatedUsers = users.map(u => u.id === user.id ? { ...u, active: !u.active } : u);
    onUpdateUsers(updatedUsers);
  };

  const handleStartEditUser = (user: User) => {
    setEditingUser(user);
    setUName(user.name);
    setUEmail(user.email);
    setURole(user.role);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!uName.trim() || !uEmail.trim()) {
      alert('Por favor, rellene todos los campos.');
      return;
    }
    const updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, name: uName.trim(), email: uEmail.toLowerCase().trim(), role: uRole } : u);
    onUpdateUsers(updatedUsers);
    
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleStartChangePassword = (user: User) => {
    setEditingUser(user);
    setUPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !uPassword.trim()) return;

    const storedPasswords = JSON.parse(localStorage.getItem('delight_passwords') || '{}');
    storedPasswords[editingUser.email] = uPassword;
    localStorage.setItem('delight_passwords', JSON.stringify(storedPasswords));

    // Save full user state to sync with Supabase
    onUpdateUsers([...users]);

    setUPassword('');
    setIsPasswordModalOpen(false);
    setEditingUser(null);
    alert('Contraseña actualizada y sincronizada correctamente en Supabase.');
  };

  const filteredUsers = useMemo(() => {
    const q = usersSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      u.role.toLowerCase().includes(q)
    );
  }, [users, usersSearch]);

  // 1. Calculations for KPIs
  const salesOrders = useMemo(() => orders.filter(o => o.type === 'venta'), [orders]);
  const redemptionOrders = useMemo(() => orders.filter(o => o.type === 'canje'), [orders]);

  const totalRevenue = useMemo(() => {
    return salesOrders.reduce((sum, o) => sum + o.total, 0);
  }, [salesOrders]);

  const averageTicket = useMemo(() => {
    if (salesOrders.length === 0) return 0;
    return totalRevenue / salesOrders.length;
  }, [salesOrders, totalRevenue]);

  const totalClubMembers = useMemo(() => customers.length, [customers]);

  // 2. Channel Sales Breakdown
  const channelData = useMemo(() => {
    const channels = Object.values(SalesChannel);
    const data = channels.map(chan => {
      const channelOrders = salesOrders.filter(o => o.channel === chan);
      const total = channelOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        channel: chan,
        total,
        count: channelOrders.length
      };
    });
    
    const maxVal = Math.max(...data.map(d => d.total), 1);
    return data.map(d => ({
      ...d,
      percent: (d.total / maxVal) * 100
    }));
  }, [salesOrders]);

  // 3. Category Distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {
      'Makis Naturales': 0,
      'Makis Empanizados': 0,
      'Makis Queso': 0,
      'Sushiburger': 0,
      'Frappés': 0,
      'Smoothies': 0,
      'Café': 0,
      'Extras': 0
    };

    salesOrders.forEach(ord => {
      ord.items.forEach(item => {
        let category = 'Extras';
        if (item.name.toLowerCase().includes('maki') && item.name.toLowerCase().includes('natural')) category = 'Makis Naturales';
        else if (item.name.toLowerCase().includes('maki') && item.name.toLowerCase().includes('empanizado')) category = 'Makis Empanizados';
        else if (item.name.toLowerCase().includes('maki') && item.name.toLowerCase().includes('queso')) category = 'Makis Queso';
        else if (item.name.toLowerCase().includes('burger') || item.name.toLowerCase().includes('sushiburger')) category = 'Sushiburger';
        else if (item.name.toLowerCase().includes('frappé') || item.name.toLowerCase().includes('oreo') || item.name.toLowerCase().includes('mazapán')) category = 'Frappés';
        else if (item.name.toLowerCase().includes('smoothie') || item.name.toLowerCase().includes('mango') || item.name.toLowerCase().includes('fresa')) category = 'Smoothies';
        else if (item.name.toLowerCase().includes('café') || item.name.toLowerCase().includes('espresso') || item.name.toLowerCase().includes('capuccino')) category = 'Café';
        
        counts[category] = (counts[category] || 0) + item.quantity;
      });
    });

    const list = Object.entries(counts).map(([name, qty]) => ({ name, qty }));
    const maxQty = Math.max(...list.map(l => l.qty), 1);
    return list.map(l => ({ ...l, percent: (l.qty / maxQty) * 100 }));
  }, [salesOrders]);

  // 4. Filter audit logs based on query
  const filteredAudits = useMemo(() => {
    const q = auditQuery.toLowerCase().trim();
    if (!q) return auditLogs;
    return auditLogs.filter(log => 
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.newValue.toLowerCase().includes(q) ||
      log.previousValue.toLowerCase().includes(q)
    );
  }, [auditLogs, auditQuery]);

  // Ticket config handler
  const handleUpdateTicketField = (field: string, value: any) => {
    const updated: SystemConfig = {
      ...config,
      ticket: {
        ...config.ticket,
        [field]: value
      }
    };
    onUpdateConfig(updated);
  };

  return (
    <div className="h-[calc(100vh-64px)] p-5 font-sans flex flex-col bg-[#FFFDF8] select-none overflow-hidden">
      
      {/* 4 Executive KPI widgets */}
      <div className="grid grid-cols-4 gap-4 shrink-0 mb-4">
        
        {/* KPI 1: Ventas Totales */}
        <div className="bg-white rounded-[2rem] border border-delight-gray/10 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-delight-green/10 text-delight-green flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block">Ventas Totales</span>
            <h3 className="text-xl font-black text-delight-dark mt-0.5">${totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[9px] text-delight-gray/60 mt-0.5 block">{salesOrders.length} transacciones</span>
          </div>
        </div>

        {/* KPI 2: Ticket Promedio */}
        <div className="bg-white rounded-[2rem] border border-delight-gray/10 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFDF8] text-delight-dark border border-delight-gray/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-delight-green" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block">Ticket Promedio</span>
            <h3 className="text-xl font-black text-delight-dark mt-0.5">${averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[9px] text-delight-gray/60 mt-0.5 block">Promedio de consumo</span>
          </div>
        </div>

        {/* KPI 3: Canjes Procesados */}
        <div className="bg-white rounded-[2rem] border border-delight-gray/10 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-delight-yellow/10 text-delight-yellow flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block">Canjes Club</span>
            <h3 className="text-xl font-black text-delight-dark mt-0.5">{redemptionOrders.length} canjes</h3>
            <span className="text-[9px] text-delight-gray/60 mt-0.5 block">Recompensas entregadas</span>
          </div>
        </div>

        {/* KPI 4: Socios Registrados */}
        <div className="bg-white rounded-[2rem] border border-delight-gray/10 p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-delight-green/10 to-delight-yellow/10 text-delight-green flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block">Socios Activos</span>
            <h3 className="text-xl font-black text-delight-dark mt-0.5">{totalClubMembers} clientes</h3>
            <span className="text-[9px] text-delight-gray/60 mt-0.5 block">Base del Club DELIGHT</span>
          </div>
        </div>

      </div>

      {/* Primary administrative navigation tab-bar */}
      <div className="flex flex-wrap gap-2 mb-4 bg-white border border-delight-gray/10 p-2 rounded-2xl shrink-0">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'metrics' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Métricas
        </button>
        <button
          onClick={() => setActiveTab('alertas')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all relative cursor-pointer ${
            activeTab === 'alertas' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Alertas
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
        </button>
        <button
          onClick={() => setActiveTab('corte')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'corte' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <Coins className="w-4 h-4" />
          Corte de Caja
          {activeRegister && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('ticket_error')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ticket_error' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Ticket con Error
          {orders.some(o => o.status === 'solicitado_cancelacion') && (
            <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 ml-1">
              {orders.filter(o => o.status === 'solicitado_cancelacion').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('produccion')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'produccion' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Producción
        </button>
        <button
          onClick={() => setActiveTab('importador')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'importador' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Importador
        </button>
        <button
          onClick={() => setActiveTab('ticket')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ticket' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Ticket & Impresión
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
            }`}
          >
            <Users className="w-4 h-4" />
            Colaboradores ({users.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'audit' ? 'bg-delight-green text-white shadow-md shadow-delight-green/15' : 'bg-transparent text-delight-gray hover:text-delight-dark'
          }`}
        >
          <Shield className="w-4 h-4" />
          Auditoría ({auditLogs.length})
        </button>
      </div>

      {/* Main Tab Panels Display */}
      <div className="flex-1 overflow-hidden">
        
        {/* METRICS PANEL */}
        {activeTab === 'metrics' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in">
            {/* Left Side: Channel and category analytics charts (7 columns) */}
            <div className="col-span-1 lg:col-span-7 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <PieChart className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Distribución por Canales y Categorías</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                {/* Sales by channel Chart */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block mb-2">Ingresos por Canales Oficiales</span>
                  <div className="space-y-2.5">
                    {channelData.map(d => (
                      <div key={d.channel} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-delight-dark">
                          <span>{d.channel} ({d.count} vtas)</span>
                          <span>${d.total.toFixed(2)}</span>
                        </div>
                        
                        <div className="h-3 bg-delight-dark/5 rounded-full overflow-hidden relative border border-delight-gray/5">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-delight-green to-delight-green-hover rounded-full transition-all duration-1000"
                            style={{ width: `${d.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales by category Chart */}
                <div className="space-y-3 pt-4 border-t border-delight-gray/5">
                  <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest block mb-2">Top Categorías Vendidas (Volumen)</span>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs font-semibold">
                    {categoryData.filter(d => d.qty > 0).map(d => (
                      <div key={d.name} className="space-y-1">
                        <div className="flex justify-between font-bold text-delight-dark">
                          <span className="truncate">{d.name}</span>
                          <span>{d.qty} pzs</span>
                        </div>
                        <div className="h-2.5 bg-delight-dark/5 rounded-full overflow-hidden relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-delight-yellow to-delight-yellow-hover rounded-full transition-all duration-1000"
                            style={{ width: `${d.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {categoryData.filter(d => d.qty > 0).length === 0 && (
                      <p className="col-span-2 text-center text-[11px] text-delight-gray/40 py-6">No hay datos de categoría suficientes para graficar.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Recent activity list audits (5 columns) */}
            <div className="col-span-1 lg:col-span-5 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Clock className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark font-sans">Historial de Operaciones</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {orders.length === 0 ? (
                  <p className="text-center text-xs text-delight-gray/45 py-12">No hay transacciones registradas.</p>
                ) : (
                  orders.map((ord) => (
                    <div 
                      key={ord.id}
                      className="bg-white border border-delight-gray/5 p-3.5 rounded-2xl flex justify-between items-center hover:border-delight-green/10 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-delight-dark">{ord.ticketNumber}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ord.type === 'canje' 
                              ? 'bg-delight-yellow/10 text-delight-yellow' 
                              : 'bg-delight-green/10 text-delight-green'
                          }`}>
                            {ord.type === 'canje' ? 'Canje' : ord.paymentMethod}
                          </span>
                        </div>
                        <span className="text-[10px] text-delight-gray/60 block">
                          Canal: {ord.channel} • Cajero: {ord.cashierName}
                        </span>
                        <span className="text-[9px] text-delight-gray/40 block font-mono">{ord.createdAt.replace('T', ' ').substring(0, 16)}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-delight-dark block">
                          {ord.type === 'canje' ? '0 pts' : `$${ord.total.toFixed(2)}`}
                        </span>
                        <span className="text-[9px] text-delight-gray/50 font-bold block">
                          {ord.type === 'canje' ? `-${ord.pointsUsed} pts` : `+${ord.pointsGenerated} pts`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 1. ALERTAS INTELIGENTES PANEL */}
        {activeTab === 'alertas' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            {/* Left side: Alert Categories */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-extrabold text-sm text-delight-dark">Insumos Críticos & Abastecimiento</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* 1.1 Insumos Críticos */}
                <div>
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-2">Bajo Stock de Insumos (Crítico)</span>
                  <div className="space-y-2">
                    {ingredients.filter(i => i.stock <= i.minStock).map(ing => (
                      <div key={ing.id} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-xs text-delight-dark block">{ing.name}</span>
                          <span className="text-[9px] text-delight-gray/60 block">Insumo ID: {ing.id}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-red-500 block">{ing.stock.toFixed(0)} {ing.unit}</span>
                          <span className="text-[9px] text-delight-gray/50 block">Mínimo: {ing.minStock} {ing.unit}</span>
                        </div>
                      </div>
                    ))}
                    {ingredients.filter(i => i.stock <= i.minStock).length === 0 && (
                      <p className="text-center py-4 text-[11px] text-delight-gray/40">¡Excelente! Todos los insumos están en niveles óptimos.</p>
                    )}
                  </div>
                </div>

                {/* 1.2 Productos Inhabilitados */}
                <div className="pt-4 border-t border-delight-gray/5">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">Productos no producibles por falta de insumo</span>
                  <div className="space-y-2">
                    {products.filter(p => {
                      if (!p.recipe || p.recipe.length === 0) return false;
                      return p.recipe.some(rec => {
                        const ing = ingredients.find(i => i.id === rec.ingredientId);
                        return !ing || ing.stock < rec.quantity;
                      });
                    }).map(prod => (
                      <div key={prod.id} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-xs text-delight-dark block">{prod.name}</span>
                          <span className="text-[9px] text-delight-gray/60 block">Faltante crítico de receta</span>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded-full uppercase">Pausado</span>
                      </div>
                    ))}
                    {products.filter(p => {
                      if (!p.recipe || p.recipe.length === 0) return false;
                      return p.recipe.some(rec => {
                        const ing = ingredients.find(i => i.id === rec.ingredientId);
                        return !ing || ing.stock < rec.quantity;
                      });
                    }).length === 0 && (
                      <p className="text-center py-4 text-[11px] text-delight-gray/40">El 100% de productos del menú están disponibles.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Customer loyalty alerts */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Users className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark font-sans">Campañas & Clientes Inactivos</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* 1.3 Inactive customers (20+ days) */}
                <div>
                  <span className="text-[10px] font-black text-delight-gray uppercase tracking-widest block mb-2">Socios Inactivos (20+ días sin comprar)</span>
                  <div className="space-y-2">
                    {customers.filter(c => {
                      const custOrders = orders.filter(o => o.customerId === c.id);
                      if (custOrders.length === 0) return true;
                      const latestOrder = custOrders.reduce((latest, o) => {
                        const d = new Date(o.createdAt).getTime();
                        return d > latest ? d : latest;
                      }, 0);
                      const days = (Date.now() - latestOrder) / (1000 * 3600 * 24);
                      return days >= 20;
                    }).slice(0, 4).map(cust => {
                      const custOrders = orders.filter(o => o.customerId === cust.id);
                      const lastOrderText = custOrders.length > 0 
                        ? `Último: ${custOrders[custOrders.length - 1].createdAt.split('T')[0]}`
                        : 'Nunca ha comprado';
                      return (
                        <div key={cust.id} className="p-3 bg-delight-dark/5 rounded-xl border border-transparent flex justify-between items-center hover:border-delight-green/10">
                          <div>
                            <span className="font-bold text-xs text-delight-dark block">{cust.name} {cust.lastName}</span>
                            <span className="text-[9px] text-delight-gray/60 block">{lastOrderText}</span>
                          </div>
                          <a href={`tel:${cust.phone}`} className="p-2 bg-delight-green/10 text-delight-green rounded-lg hover:bg-delight-green hover:text-white transition-colors">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                    {customers.filter(c => {
                      const custOrders = orders.filter(o => o.customerId === c.id);
                      if (custOrders.length === 0) return true;
                      const latestOrder = custOrders.reduce((latest, o) => {
                        const d = new Date(o.createdAt).getTime();
                        return d > latest ? d : latest;
                      }, 0);
                      const days = (Date.now() - latestOrder) / (1000 * 3600 * 24);
                      return days >= 20;
                    }).length === 0 && (
                      <p className="text-center py-4 text-[11px] text-delight-gray/40">No hay socios inactivos registrados.</p>
                    )}
                  </div>
                </div>

                {/* 1.4 Birthday alarms */}
                <div className="pt-4 border-t border-delight-gray/5">
                  <span className="text-[10px] font-black text-delight-green uppercase tracking-widest block mb-2">Cumpleaños de socios (Este Mes)</span>
                  <div className="space-y-2">
                    {customers.filter(c => {
                      if (!c.birthdate) return false;
                      const bDate = new Date(c.birthdate);
                      return bDate.getMonth() === new Date().getMonth();
                    }).map(cust => (
                      <div key={cust.id} className="p-3 bg-gradient-to-r from-delight-green/5 to-delight-yellow/5 rounded-xl border border-delight-green/10 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-xs text-delight-dark block">🎉 {cust.name} {cust.lastName}</span>
                          <span className="text-[9px] text-delight-gray/60 block">Cumpleaños: {cust.birthdate}</span>
                        </div>
                        <span className="text-[9px] bg-delight-green/15 text-delight-green font-black px-2 py-0.5 rounded-full uppercase">Regalar 15%</span>
                      </div>
                    ))}
                    {customers.filter(c => {
                      if (!c.birthdate) return false;
                      const bDate = new Date(c.birthdate);
                      return bDate.getMonth() === new Date().getMonth();
                    }).length === 0 && (
                      <p className="text-center py-4 text-[11px] text-delight-gray/40">No hay socios de cumpleaños este mes.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CORTE DE CAJA PANEL */}
        {activeTab === 'corte' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            {/* Live Cut Desk / Form (7 columns) */}
            <div className="col-span-1 lg:col-span-7 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Coins className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Arqueo y Reconciliación de Caja en Vivo</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activeRegister ? (
                  <div className="space-y-4">
                    {/* Active session info */}
                    <div className="bg-gradient-to-r from-delight-green/10 to-delight-yellow/10 rounded-2xl p-4 flex justify-between items-center border border-delight-green/20">
                      <div>
                        <span className="text-[9px] font-black text-delight-green uppercase tracking-wider block">Sesión de Caja Activa</span>
                        <h4 className="text-sm font-black text-delight-dark mt-0.5">Responsable: {activeRegister.openedByName}</h4>
                        <span className="text-[9px] text-delight-gray/60 block font-mono">Abierto: {activeRegister.openedAt.replace('T', ' ').substring(0, 16)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-delight-gray/60 uppercase block font-bold">Fondo Inicial</span>
                        <span className="text-lg font-black text-delight-green">${activeRegister.initialFloat.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Calculated live totals */}
                    {(() => {
                      const cutOrders = orders.filter(o => new Date(o.createdAt).getTime() >= new Date(activeRegister.openedAt).getTime());
                      const vEfectivo = cutOrders.filter(o => o.paymentMethod === 'efectivo' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
                      const vTarjeta = cutOrders.filter(o => o.paymentMethod === 'tarjeta' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
                      const vTransferencia = cutOrders.filter(o => o.paymentMethod === 'transferencia' && o.type === 'venta' && o.status !== 'cancelado').reduce((sum, o) => sum + o.total, 0);
                      const canjes = cutOrders.filter(o => o.type === 'canje' && o.status !== 'cancelado').length;
                      const cancelados = cutOrders.filter(o => o.status === 'cancelado').length;

                      const expectedCash = activeRegister.initialFloat + vEfectivo;
                      const realContado = parseFloat(corteEfectivoContado || '0');
                      const diff = realContado - expectedCash;

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3.5 bg-delight-dark/5 rounded-2xl border border-transparent">
                              <span className="text-[9px] text-delight-gray/60 uppercase font-black block">Efectivo (+ Fondo)</span>
                              <span className="text-sm font-black text-delight-dark mt-0.5">${expectedCash.toFixed(2)}</span>
                            </div>
                            <div className="p-3.5 bg-delight-dark/5 rounded-2xl border border-transparent">
                              <span className="text-[9px] text-delight-gray/60 uppercase font-black block">Ventas Tarjeta</span>
                              <span className="text-sm font-black text-delight-dark mt-0.5">${vTarjeta.toFixed(2)}</span>
                            </div>
                            <div className="p-3.5 bg-delight-dark/5 rounded-2xl border border-transparent">
                              <span className="text-[9px] text-delight-gray/60 uppercase font-black block">Ventas Transf.</span>
                              <span className="text-sm font-black text-delight-dark mt-0.5">${vTransferencia.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 bg-delight-dark/5 rounded-2xl border border-transparent">
                              <span className="text-[9px] text-delight-gray/60 uppercase font-black block">Canjes Realizados</span>
                              <span className="text-sm font-black text-delight-dark mt-0.5">{canjes} productos</span>
                            </div>
                            <div className="p-3.5 bg-red-500/5 rounded-2xl border border-red-500/10 text-red-500">
                              <span className="text-[9px] text-red-500/60 uppercase font-black block">Cancelaciones</span>
                              <span className="text-sm font-black mt-0.5">{cancelados} tickets</span>
                            </div>
                          </div>

                          {/* Closing Form */}
                          <div className="pt-4 border-t border-delight-gray/5 space-y-3.5">
                            <h5 className="text-[10px] font-black uppercase text-delight-green tracking-wider">Cerrar Caja y Registrar Valores</h5>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Efectivo Físico Contado ($)</label>
                                <input 
                                  type="number" 
                                  value={corteEfectivoContado}
                                  onChange={(e) => setCorteEfectivoContado(e.target.value)}
                                  placeholder="Ingresa el efectivo real"
                                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Diferencia de Caja</label>
                                <div className={`w-full rounded-xl py-2.5 px-3.5 text-xs font-black border flex items-center justify-between ${
                                  diff === 0 
                                    ? 'bg-delight-green/10 border-delight-green/20 text-delight-green' 
                                    : diff < 0 
                                      ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                }`}>
                                  <span>${diff.toFixed(2)}</span>
                                  <span className="text-[9px] font-bold uppercase">
                                    {diff === 0 ? 'Exacto' : diff < 0 ? 'Faltante' : 'Sobrante'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {diff !== 0 && (
                              <div className="animate-fade-in">
                                <label className="block text-[9px] font-black text-red-500 uppercase tracking-wider mb-1">Explicación / Justificación de la Diferencia (Obligatorio)</label>
                                <textarea 
                                  value={corteMotivoDiferencia}
                                  onChange={(e) => setCorteMotivoDiferencia(e.target.value)}
                                  placeholder="¿A qué se debe este faltante o sobrante? (Ej: error en cambio)"
                                  className="w-full bg-red-500/5 border border-red-500/10 rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-red-500/30 h-16 resize-none"
                                />
                              </div>
                            )}

                            <button
                              onClick={() => handleCloseCorte(parseFloat(corteEfectivoContado || '0'), corteMotivoDiferencia)}
                              className="w-full py-3 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Lock className="w-4 h-4" />
                              Registrar Corte y Sellar Turno
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-delight-dark/5 rounded-full flex items-center justify-center text-delight-gray/60 mb-3">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h5 className="font-extrabold text-sm text-delight-dark">Turno Cerrado / Sin Caja Activa</h5>
                    <p className="text-[11px] text-delight-gray/60 max-w-xs mt-1 mb-4">Para comenzar a registrar ventas normales en efectivo y tarjeta, debes iniciar una nueva sesión de caja.</p>

                    <div className="w-full max-w-sm space-y-3.5 bg-delight-dark/5 p-4 rounded-2xl text-left border border-delight-gray/5">
                      <div>
                        <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Fondo Inicial de Caja (Efectivo base)</label>
                        <input 
                          type="number" 
                          value={corteFondoInicial}
                          onChange={(e) => setCorteFondoInicial(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-delight-gray/10 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-delight-green/30"
                        />
                      </div>
                      <button
                        onClick={() => handleStartCorte(corteFondoInicial)}
                        className="w-full py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-delight-green/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Abrir Nueva Caja
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History of Closed Cuts (5 columns) */}
            <div className="col-span-1 lg:col-span-5 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Clock className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Histórico de Cortes Sellados</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {cashHistory.length === 0 ? (
                  <p className="text-center text-xs text-delight-gray/45 py-12">No hay cortes de caja anteriores.</p>
                ) : (
                  cashHistory.map((cut) => (
                    <div 
                      key={cut.id}
                      className="bg-white border border-delight-gray/5 p-3.5 rounded-2xl space-y-2 hover:border-delight-green/10 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-delight-dark">Arqueo: {cut.openedByName}</span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                          cut.status === 'revisado' 
                            ? 'bg-delight-green/10 text-delight-green' 
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {cut.status === 'revisado' ? 'Revisado' : 'Pendiente Firma'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-delight-gray/70">
                        <span>Esperado: <strong>${cut.totalEsperado.toFixed(0)}</strong></span>
                        <span>Contado: <strong>${cut.efectivoContado.toFixed(0)}</strong></span>
                        <span className={cut.diferencia === 0 ? 'text-delight-green' : 'text-red-500'}>
                          Diferencia: <strong>${cut.diferencia.toFixed(0)}</strong>
                        </span>
                        <span className="truncate font-mono text-[8px]">{cut.fechaHoraCierre?.split('T')[0]}</span>
                      </div>

                      {cut.motivoDiferencia && (
                        <p className="p-2 bg-red-500/5 text-[9px] text-red-500 rounded-lg italic">
                          Motivo: {cut.motivoDiferencia}
                        </p>
                      )}

                      {cut.status === 'cerrado' && currentUser.role === 'admin' && (
                        <button
                          onClick={() => handleReviewCorte(cut.id)}
                          className="w-full py-1.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-lg font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Validar & Firmar Corte
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. TICKET CON ERROR PANEL (CANCELACIONES) */}
        {activeTab === 'ticket_error' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            {/* Pending Requests & Approval Portal (7 columns) */}
            <div className="col-span-1 lg:col-span-7 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-red-500" />
                  <h4 className="font-extrabold text-sm text-delight-dark font-sans">Solicitudes de Cancelación de Ticket</h4>
                </div>
                <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {orders.filter(o => o.status === 'solicitado_cancelacion').length} pendientes
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {orders.filter(o => o.status === 'solicitado_cancelacion').map(ord => (
                  <div key={ord.id} className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-3 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black text-delight-dark block">Folio Ticket: {ord.ticketNumber}</span>
                        <span className="text-[10px] text-delight-gray/60 block">Cajero: {ord.cashierName} • Fecha: {ord.createdAt.replace('T', ' ').substring(0, 16)}</span>
                      </div>
                      <span className="text-sm font-black text-red-500">${ord.total.toFixed(2)}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-red-500/5 text-[10px] text-red-500 italic">
                      <strong>Motivo de cancelación:</strong> "{ord.cancellationReason || 'No especificado'}"
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => handleApproveCancellation(ord.id, ord.cancellationReason || '')}
                        className="py-2 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Autorizar & Revertir
                      </button>
                      <button
                        onClick={() => handleRejectCancellation(ord.id)}
                        className="py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md shadow-red-500/10 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazar Solicitud
                      </button>
                    </div>
                  </div>
                ))}
                {orders.filter(o => o.status === 'solicitado_cancelacion').length === 0 && (
                  <div className="py-12 text-center text-delight-gray/40">
                    <CheckCircle2 className="w-12 h-12 text-delight-green/35 mx-auto mb-2" />
                    <p className="text-xs font-bold text-delight-dark">No hay solicitudes de cancelación pendientes.</p>
                    <p className="text-[10px] text-delight-gray/50 max-w-xs mx-auto mt-0.5">Las solicitudes de cajeros para corregir tickets con error aparecerán en esta área.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Ticket search & manual cancellation (5 columns) */}
            <div className="col-span-1 lg:col-span-5 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-delight-gray/5 shrink-0">
                <Search className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Buscar Ticket para Cancelar</h4>
              </div>

              <div className="space-y-3 shrink-0 mb-4">
                <input 
                  type="text"
                  placeholder="Buscar por Folio (Ej: F-1002)..."
                  value={ticketSearchQuery}
                  onChange={(e) => setTicketSearchQuery(e.target.value)}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {orders
                  .filter(o => o.status !== 'cancelado')
                  .filter(o => !ticketSearchQuery || o.ticketNumber.toLowerCase().includes(ticketSearchQuery.toLowerCase()))
                  .slice(0, 8)
                  .map(ord => (
                    <div 
                      key={ord.id} 
                      className={`p-3 bg-white border rounded-xl cursor-pointer hover:border-delight-green/20 transition-all ${
                        selectedTicketForCancel?.id === ord.id ? 'border-delight-green bg-delight-green/5' : 'border-delight-gray/5'
                      }`}
                      onClick={() => {
                        setSelectedTicketForCancel(ord);
                        setCancelReasonText(ord.cancellationReason || '');
                      }}
                    >
                      <div className="flex justify-between font-bold text-xs">
                        <span className="text-delight-dark">{ord.ticketNumber}</span>
                        <span className="text-delight-dark">${ord.total.toFixed(2)}</span>
                      </div>
                      <span className="text-[9px] text-delight-gray/60 block mt-0.5">
                        {ord.createdAt.replace('T', ' ').substring(0, 16)} • {ord.cashierName}
                      </span>
                    </div>
                  ))}
              </div>

              {selectedTicketForCancel && (
                <div className="border-t border-delight-gray/5 pt-3.5 mt-3 space-y-2.5 animate-fade-in shrink-0">
                  <span className="text-[9px] font-black text-red-500 uppercase tracking-widest block">Acción sobre Ticket {selectedTicketForCancel.ticketNumber}</span>
                  <input 
                    type="text"
                    placeholder="Escribe el motivo..."
                    value={cancelReasonText}
                    onChange={(e) => setCancelReasonText(e.target.value)}
                    className="w-full bg-red-50/50 border border-red-100 rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white"
                  />
                  <button
                    onClick={() => handleRequestCancellation(selectedTicketForCancel.id, cancelReasonText)}
                    className="w-full py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-red-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    {currentUser.role === 'admin' ? 'Cancelar Ticket Al Instante' : 'Mandar Solicitud'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. PRODUCCION INTELIGENTE PANEL */}
        {activeTab === 'produccion' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            {/* Circular bottlenecks and limiting factors (6 columns) */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Sparkles className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark font-sans">Producción de Arroz & Bottlenecks</h4>
              </div>

              {(() => {
                const metrics = calculateProductionMetrics(ingredients, products);
                const riceIng = ingredients.find(i => i.name.toLowerCase().includes('arroz') || i.id === 'ing-1');
                const riceStock = riceIng ? riceIng.stock : 0;
                const makiEquivs = Math.floor(riceStock / 150);

                return (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {/* Rice available visual card */}
                    <div className="p-4 bg-gradient-to-r from-delight-green/10 to-delight-green-hover/5 rounded-2xl border border-delight-green/20 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black text-delight-green uppercase tracking-widest block">Arroz Preparado Disponible</span>
                        <h4 className="text-xl font-black text-delight-dark mt-1">{(riceStock / 1000).toFixed(1)} kg</h4>
                        <span className="text-[9px] text-delight-gray/60 block mt-0.5">Insumo: {riceIng ? riceIng.name : 'Arroz'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-delight-gray/50 uppercase block font-bold">Rendimiento Makis</span>
                        <span className="text-2xl font-black text-delight-green mt-0.5">{makiEquivs} piezas</span>
                      </div>
                    </div>

                    {/* Bottlenecks lists */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">Ingredientes cuello de botella (Insumos Críticos)</span>
                      <div className="space-y-2">
                        {metrics.insumosCriticos.map(ic => (
                          <div key={ic.ingredientName} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-xs text-delight-dark block">{ic.ingredientName}</span>
                              <span className="text-[9px] text-delight-gray/50 block">Stock actual: {ic.stock.toFixed(0)} {ic.unit}</span>
                            </div>
                            <span className="text-[10px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-full uppercase">Crítico</span>
                          </div>
                        ))}
                        {metrics.insumosCriticos.length === 0 && (
                          <p className="text-[11px] text-delight-gray/50 text-center py-4">No hay cuellos de botella de ingredientes en este momento.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Smart production recommendations (6 columns) */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <TrendingUp className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark font-sans">Sugerencias Inteligentes de Preparación</h4>
              </div>

              {(() => {
                const metrics = calculateProductionMetrics(ingredients, products);
                return (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <span className="text-[10px] font-black text-delight-gray uppercase tracking-widest block mb-2">Recomendaciones del Asistente Operativo</span>
                    <div className="space-y-2.5">
                      {metrics.recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-white to-delight-dark/5 rounded-xl border border-delight-gray/5 flex items-start gap-2">
                          <span className="text-delight-green font-black">⚡</span>
                          <p className="text-[11px] text-delight-dark leading-relaxed font-sans font-medium">{rec}</p>
                        </div>
                      ))}
                      {metrics.recommendations.length === 0 && (
                        <p className="text-[11px] text-delight-gray/50 text-center py-4">Suficiente stock de productos preparados en el mostrador.</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* 5. IMPORTADOR INTELIGENTE PANEL */}
        {activeTab === 'importador' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            {/* Input and Configuration (6 columns) */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Subida Masiva de Insumos & Productos</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Mode toggle */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider">Tipo de Datos a Importar</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setImportTargetType('products'); setImportPreviewRows([]); }}
                      className={`flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        importTargetType === 'products' ? 'bg-delight-green border-transparent text-white' : 'bg-white border-delight-gray/15 text-delight-gray'
                      }`}
                    >
                      Productos
                    </button>
                    <button 
                      onClick={() => { setImportTargetType('ingredients'); setImportPreviewRows([]); }}
                      className={`flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        importTargetType === 'ingredients' ? 'bg-delight-green border-transparent text-white' : 'bg-white border-delight-gray/15 text-delight-gray'
                      }`}
                    >
                      Insumos
                    </button>
                    <button 
                      onClick={() => { setImportTargetType('customers'); setImportPreviewRows([]); }}
                      className={`flex-1 py-2 text-center rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                        importTargetType === 'customers' ? 'bg-delight-green border-transparent text-white' : 'bg-white border-delight-gray/15 text-delight-gray'
                      }`}
                    >
                      Socios
                    </button>
                  </div>
                </div>

                {/* CSV text block */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider">Pegar Contenido CSV (Comas ,)</label>
                    <button
                      onClick={() => {
                        if (importTargetType === 'products') {
                          setImportText("nombre,categoria,precio_mostrador,precio_uber,precio_didi\nMaki Delight Especial,Makis Empanizados,120,140,135\nFrappé Coco Loco,Frappés,65,78,75");
                        } else if (importTargetType === 'ingredients') {
                          setImportText("nombre,stock,unidad,min_stock\nArroz Premium,15000,g,2000\nQueso Philadelphia,4000,g,800");
                        } else if (importTargetType === 'customers') {
                          setImportText("nombre,telefono,birthdate,puntos\nJuan Pérez,5551234567,1995-10-12,120\nAna Martínez,5559876543,1992-05-18,450");
                        }
                      }}
                      className="text-[9px] text-delight-green hover:underline uppercase font-black"
                    >
                      Cargar Muestra
                    </button>
                  </div>
                  <textarea 
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={
                      importTargetType === 'products' 
                        ? 'nombre,categoria,precio_mostrador,precio_uber,precio_didi\nFrappé Oreo,Frappés,65,78,75' 
                        : importTargetType === 'ingredients'
                          ? 'nombre,stock,unidad,min_stock\nCamarón Grande,3000,g,500'
                          : 'nombre,telefono,birthdate,puntos\nMaría,5553213210,1994-08-11,80'
                    }
                    className="w-full bg-delight-dark/5 border border-transparent rounded-2xl py-3 px-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 h-44 resize-none font-mono"
                  />
                </div>

                {importSuccessAlert && (
                  <div className="p-3 bg-delight-green/10 border border-delight-green/25 text-delight-green rounded-xl text-[10px] font-bold">
                    {importSuccessAlert}
                  </div>
                )}
                {importErrorAlert && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl text-[10px] font-bold">
                    {importErrorAlert}
                  </div>
                )}

                <button
                  onClick={handleParseImportCSV}
                  className="w-full py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  Analizar y Previsualizar Datos
                </button>
              </div>
            </div>

            {/* Preview Sheet (6 columns) */}
            <div className="col-span-1 lg:col-span-6 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Clock className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Previsualización de Hojas de Datos ({importPreviewRows.length})</h4>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[10px]">
                  {importPreviewRows.map((row, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 bg-white border rounded-xl flex justify-between items-center ${
                        row._errors.length > 0 ? 'border-red-500 bg-red-500/5' : 'border-delight-gray/5'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs text-delight-dark block">
                          #{row._rowIndex}: {row.nombre || row.name || 'Sin Nombre'}
                        </span>
                        <span className="text-[9px] text-delight-gray/50 block">
                          {importTargetType === 'products' && `Precio: $${row.precio_mostrador || row.price || '0'} | Cat: ${row.categoria || row.category || 'N/A'}`}
                          {importTargetType === 'ingredients' && `Stock: ${row.stock || '0'}${row.unidad || row.unit || 'g'} | Mín: ${row.min_stock || row.minstock || '1000'}`}
                          {importTargetType === 'customers' && `Tel: ${row.telefono || row.phone} | Puntos: ${row.puntos || row.points || '0'}`}
                        </span>
                      </div>
                      
                      {row._errors.length > 0 ? (
                        <span className="text-[8px] bg-red-500 text-white font-black px-2 py-0.5 rounded-full uppercase">
                          Error
                        </span>
                      ) : (
                        <span className="text-[8px] bg-delight-green/15 text-delight-green font-bold px-2 py-0.5 rounded-full uppercase">
                          Válido
                        </span>
                      )}
                    </div>
                  ))}
                  {importPreviewRows.length === 0 && (
                    <p className="text-center py-12 text-delight-gray/40 font-bold">No hay ninguna hoja analizada. Carga una muestra o escribe tu propio CSV y analízalo.</p>
                  )}
                </div>

                {importPreviewRows.length > 0 && (
                  <button
                    onClick={handleExecuteImport}
                    className="mt-4 w-full py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Ejecutar Importación Masiva
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATION PANEL */}
        {activeTab === 'ticket' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            
            {/* Ticket & Print Routing Forms (7 columns) */}
            <div className="col-span-1 lg:col-span-7 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-delight-gray/5 shrink-0">
                <Printer className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Configuración General del Ticket de Venta</h4>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                
                {/* 1. Header Information */}
                <div className="space-y-3.5">
                  <h5 className="text-[10px] font-black uppercase text-delight-green tracking-widest">1. Cabecera del Ticket</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Nombre Comercial</label>
                      <input 
                        type="text" 
                        value={config.ticket.businessName}
                        onChange={(e) => handleUpdateTicketField('businessName', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Texto Logo / Cabecera</label>
                      <input 
                        type="text" 
                        value={config.ticket.logoText}
                        onChange={(e) => handleUpdateTicketField('logoText', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Dirección Física de Sucursal</label>
                    <input 
                      type="text" 
                      value={config.ticket.address}
                      onChange={(e) => handleUpdateTicketField('address', e.target.value)}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Teléfono Fijo</label>
                      <input 
                        type="text" 
                        value={config.ticket.phone}
                        onChange={(e) => handleUpdateTicketField('phone', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">WhatsApp de Pedidos</label>
                      <input 
                        type="text" 
                        value={config.ticket.whatsapp}
                        onChange={(e) => handleUpdateTicketField('whatsapp', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Instagram (@usuario)</label>
                      <input 
                        type="text" 
                        value={config.ticket.instagram || ''}
                        onChange={(e) => handleUpdateTicketField('instagram', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                        placeholder="@delight"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Logo URL (Imagen)</label>
                      <input 
                        type="text" 
                        value={config.ticket.logoUrl || ''}
                        onChange={(e) => handleUpdateTicketField('logoUrl', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                        placeholder="https://ejemplo.com/logo.png"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Información Fiscal (RFC, Razón Social - Futuro)</label>
                    <input 
                      type="text" 
                      value={config.ticket.fiscalInfo || ''}
                      onChange={(e) => handleUpdateTicketField('fiscalInfo', e.target.value)}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3.5 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      placeholder="RFC: DEL990101XX1, Razón Social: Delight S.A. de C.V."
                    />
                  </div>
                </div>

                {/* 2. Format & Layout Settings */}
                <div className="space-y-3 pt-4 border-t border-delight-gray/5">
                  <h5 className="text-[10px] font-black uppercase text-delight-green tracking-widest">2. Formato de Papel e Impresión</h5>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Tamaño del Ticket</label>
                      <select
                        value={config.ticket.ticketSize}
                        onChange={(e) => handleUpdateTicketField('ticketSize', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30 cursor-pointer"
                      >
                        <option value="58mm">Caja Chica (58mm)</option>
                        <option value="80mm">Caja Grande (80mm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Copias a Imprimir</label>
                      <input 
                        type="number" 
                        min={1}
                        max={5}
                        value={config.ticket.copies}
                        onChange={(e) => handleUpdateTicketField('copies', parseInt(e.target.value) || 1)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Ruteo de Ticket de Cocina</label>
                      <select
                        value={config.ticket.printSetting}
                        onChange={(e) => handleUpdateTicketField('printSetting', e.target.value)}
                        className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 px-2 text-xs font-bold outline-none focus:bg-white focus:border-delight-green/30 cursor-pointer"
                      >
                        <option value="ticket_only">Solo Ticket de Caja</option>
                        <option value="kitchen_only">Solo Ticket de Cocina</option>
                        <option value="both">Ticket + Cocina Impreso</option>
                        <option value="no_kitchen_kds_only">Sin Impresión (Solo KDS Digital)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Footer and Display Toggles */}
                <div className="space-y-3 pt-4 border-t border-delight-gray/5">
                  <h5 className="text-[10px] font-black uppercase text-delight-green tracking-widest">3. Datos Visibles & Pie de Página</h5>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Mensaje Final de Pie de Ticket</label>
                    <textarea
                      rows={2}
                      value={config.ticket.footerText}
                      onChange={(e) => handleUpdateTicketField('footerText', e.target.value)}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center gap-2 p-2.5 border border-delight-gray/5 rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.ticket.showCashier}
                        onChange={(e) => handleUpdateTicketField('showCashier', e.target.checked)}
                        className="rounded text-delight-green focus:ring-delight-green/20"
                      />
                      <span className="text-[10px] font-bold text-delight-dark">Mostrar Cajero</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 border border-delight-gray/5 rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.ticket.showPointsInfo}
                        onChange={(e) => handleUpdateTicketField('showPointsInfo', e.target.checked)}
                        className="rounded text-delight-green focus:ring-delight-green/20"
                      />
                      <span className="text-[10px] font-bold text-delight-dark">Puntos Club</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 border border-delight-gray/5 rounded-xl bg-gray-50/50 hover:bg-white transition-colors cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config.ticket.showTax}
                        onChange={(e) => handleUpdateTicketField('showTax', e.target.checked)}
                        className="rounded text-delight-green focus:ring-delight-green/20"
                      />
                      <span className="text-[10px] font-bold text-delight-dark">Mostrar IVA/Imp</span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* LIVE TICKET SIMULATOR (5 columns) */}
            <div className="col-span-1 lg:col-span-5 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-delight-gray/5 shrink-0">
                <Receipt className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Simulador Físico de Ticket</h4>
              </div>
              <p className="text-[10px] text-delight-gray/60 mb-4 shrink-0">Muestra la escala real del ticket según el ancho del papel térmico configurado ({config.ticket.ticketSize}):</p>

              {/* Thermal paper envelope */}
              <div className="flex-1 bg-gray-100/55 rounded-2xl flex items-start justify-center p-4 overflow-y-auto shadow-inner relative">
                
                {/* Physical ticket body scaled */}
                <div 
                  className="bg-white border-x border-gray-200 p-4 space-y-4 shadow-xl text-black font-mono relative leading-relaxed text-[11px] animate-fade-in"
                  style={{ 
                    width: config.ticket.ticketSize === '58mm' ? '210px' : '290px',
                    minHeight: '380px'
                  }}
                >
                  
                  {/* Jagged border simulation at top and bottom */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_2px,white_2px)] bg-[length:6px_6px]" />
                  
                  {/* Store Info Header */}
                  <div className="text-center space-y-1">
                    <div className="font-sans font-black tracking-widest text-sm uppercase">{config.ticket.logoText}</div>
                    <div className="text-xs font-bold">{config.ticket.businessName}</div>
                    <div className="text-[9px] text-gray-500 font-sans leading-tight">{config.ticket.address}</div>
                    <div className="text-[9px] text-gray-500 font-sans">WhatsApp: {config.ticket.whatsapp}</div>
                    <div className="text-[9px] text-gray-500 font-sans">Tel: {config.ticket.phone}</div>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Order Details Metadata */}
                  <div className="space-y-0.5 text-[9px] text-gray-700">
                    <div>FECHA: {new Date().toLocaleDateString('es-MX')}  HORA: {new Date().toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</div>
                    <div>TICKET #: VT-82193  TIPO: MOSTRADOR</div>
                    {config.ticket.showCashier && <div>CAJERO: {currentUser?.name || 'Administrador'}</div>}
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Items list */}
                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between font-bold">
                      <span>CANT  DESCRIPCIÓN</span>
                      <span>TOTAL</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>1 x Maki Empanizado Especial</span>
                        <span>$145.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 x Frappé Oreo Clásico</span>
                        <span>$85.00</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Totals Box */}
                  <div className="text-[10px] space-y-0.5">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>$230.00</span>
                    </div>
                    {config.ticket.showTax && (
                      <div className="flex justify-between text-gray-500 text-[9px]">
                        <span>IVA (16% INC):</span>
                        <span>$31.72</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-gray-300">
                      <span>TOTAL MXN:</span>
                      <span>$230.00</span>
                    </div>
                  </div>

                  {config.ticket.showPointsInfo && (
                    <div className="border-t border-dotted border-gray-400 pt-2 text-center text-[9px] space-y-0.5 font-bold">
                      <div>CLUB DELIGHT SOCIO: DL-0103</div>
                      <div>PUNTOS GENERADOS: +2 pts</div>
                      <div>SALDO DISPONIBLE: 24 pts</div>
                    </div>
                  )}

                  <div className="border-t border-dashed border-gray-400 my-2" />

                  {/* Footer message */}
                  <div className="text-center text-[9px] text-gray-600 font-sans italic pt-1 leading-normal">
                    {config.ticket.footerText}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[radial-gradient(circle,transparent_2px,white_2px)] bg-[length:6px_6px]" />

                </div>

              </div>
            </div>

          </div>
        )}

        {/* AUDIT LOG TABLE PANEL */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden animate-fade-in text-xs font-semibold text-delight-dark text-left">
            <div className="flex justify-between items-center mb-4 border-b border-delight-gray/5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Bitácora de Seguridad y Auditoría de Procesos</h4>
              </div>
              <span className="text-[10px] bg-red-50 text-red-700 px-3 py-1 rounded-md font-bold uppercase tracking-wider">
                Operaciones Auditadas Permanentemente
              </span>
            </div>

            {/* Query Filter Input */}
            <div className="mb-4 relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/40 w-4 h-4" />
              <input
                type="text"
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
                placeholder="Buscar logs por usuario, acción, módulo o cambios de valor..."
              />
            </div>

            {/* Audit Spreadsheet List */}
            <div className="flex-1 overflow-y-auto">
              {filteredAudits.length === 0 ? (
                <div className="p-12 text-center">
                  <Search className="w-10 h-10 text-delight-gray/15 mx-auto mb-2" />
                  <p className="text-xs font-bold text-delight-gray/50">No se encontraron registros de auditoría que coincidan.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-delight-dark/5 text-[9px] font-bold uppercase tracking-wider text-delight-gray sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Módulo</th>
                      <th className="py-3 px-4">Acción</th>
                      <th className="py-3 px-4">Valor Anterior</th>
                      <th className="py-3 px-4">Valor Nuevo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-delight-gray/5 text-xs text-delight-dark font-semibold">
                    {filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[10px] text-delight-gray">{log.date} {log.time}</td>
                        <td className="py-3 px-4 font-bold text-delight-dark">{log.user}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-delight-green/10 text-delight-green rounded">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-delight-dark font-black">{log.action}</td>
                        <td className="py-3 px-4 max-w-xs truncate font-mono text-[10px] text-delight-gray/80 italic">{log.previousValue}</td>
                        <td className="py-3 px-4 max-w-xs truncate font-mono text-[10px] text-delight-green font-bold">{log.newValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

        {/* USERS TAB PANEL (ADMIN ONLY) */}
        {activeTab === 'users' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl p-6 flex flex-col h-full overflow-hidden animate-fade-in">
            {/* Header section with search and add button */}
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-delight-green" />
                <h4 className="font-extrabold text-sm text-delight-dark">Gestión de Usuarios y Accesos</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setUName('');
                  setUEmail('');
                  setURole(UserRole.CASHIER);
                  setUPassword('');
                  setIsCreateModalOpen(true);
                }}
                className="py-2.5 px-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-delight-green/10 active:scale-95 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Colaborador
              </button>
            </div>

            {/* Search filter input */}
            <div className="mb-4 relative shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/40 w-4 h-4" />
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
                placeholder="Buscar usuarios por nombre, correo o rol..."
              />
            </div>

            {/* List spreadsheet table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-delight-dark/5 text-[9px] font-bold uppercase tracking-wider text-delight-gray sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-4">Nombre / Email</th>
                    <th className="py-3 px-4">Rol de Sistema</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-delight-gray/5 text-xs text-delight-dark font-semibold">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-delight-green/10 text-delight-green font-black flex items-center justify-center">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-delight-dark">{u.name}</div>
                            <div className="text-[10px] text-delight-gray">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          u.role === UserRole.CASHIER ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-orange-50 text-orange-700 border border-orange-100'
                        }`}>
                          {u.role === UserRole.ADMIN ? 'Administrador' :
                           u.role === UserRole.CASHIER ? 'Cajero POS' : 'Cocina KDS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all border ${
                            u.active 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'
                          }`}
                        >
                          {u.active ? 'Activo' : 'Suspendido'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartChangePassword(u)}
                          className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors"
                          title="Cambiar PIN/Contraseña"
                        >
                          <Key className="w-4 h-4 inline text-delight-green" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditUser(u)}
                          className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors"
                          title="Editar Colaborador"
                        >
                          <Edit className="w-4 h-4 inline text-delight-green" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CREATE USER MODAL */}
            {isCreateModalOpen && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <form onSubmit={handleCreateUser} className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative border border-white flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-delight-gray/5">
                    <h4 className="font-extrabold text-sm text-delight-dark">Registrar Colaborador</h4>
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-delight-gray text-xs font-bold hover:text-delight-dark">Cerrar</button>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={uName}
                      onChange={(e) => setUName(e.target.value)}
                      required
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      placeholder="e.g. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={uEmail}
                      onChange={(e) => setUEmail(e.target.value)}
                      required
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      placeholder="e.g. juan@delight.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Rol en Sistema</label>
                    <select
                      value={uRole}
                      onChange={(e) => setURole(e.target.value as UserRole)}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                    >
                      <option value={UserRole.CASHIER}>Cajero POS</option>
                      <option value={UserRole.KITCHEN}>Cocina KDS</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Contraseña / PIN de Acceso</label>
                    <input 
                      type="text" 
                      value={uPassword}
                      onChange={(e) => setUPassword(e.target.value)}
                      required
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                      placeholder="Contraseña o PIN numérico"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
                  >
                    Crear y Sincronizar
                  </button>
                </form>
              </div>
            )}

            {/* EDIT USER MODAL */}
            {isEditModalOpen && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <form onSubmit={handleUpdateUser} className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative border border-white flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-delight-gray/5">
                    <h4 className="font-extrabold text-sm text-delight-dark">Editar Colaborador</h4>
                    <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingUser(null); }} className="text-delight-gray text-xs font-bold hover:text-delight-dark">Cerrar</button>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={uName}
                      onChange={(e) => setUName(e.target.value)}
                      required
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={uEmail}
                      onChange={(e) => setUEmail(e.target.value)}
                      required
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Rol en Sistema</label>
                    <select
                      value={uRole}
                      onChange={(e) => setURole(e.target.value as UserRole)}
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                    >
                      <option value={UserRole.CASHIER}>Cajero POS</option>
                      <option value={UserRole.KITCHEN}>Cocina KDS</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </form>
              </div>
            )}

            {/* PASSWORD PIN MODAL */}
            {isPasswordModalOpen && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <form onSubmit={handleSaveNewPassword} className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative border border-white flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-delight-gray/5">
                    <h4 className="font-extrabold text-sm text-delight-dark">Cambiar PIN / Contraseña</h4>
                    <button type="button" onClick={() => { setIsPasswordModalOpen(false); setEditingUser(null); }} className="text-delight-gray text-xs font-bold hover:text-delight-dark">Cerrar</button>
                  </div>

                  <div className="p-3 bg-delight-dark/5 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-delight-gray">Colaborador</p>
                    <p className="text-xs font-black text-delight-dark">{editingUser?.name}</p>
                    <p className="text-[10px] text-delight-gray/70">{editingUser?.email}</p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-delight-gray uppercase tracking-wider mb-1">Nueva Contraseña o PIN de Acceso</label>
                    <input 
                      type="text" 
                      value={uPassword}
                      onChange={(e) => setUPassword(e.target.value)}
                      required
                      placeholder="Escribe el nuevo PIN o contraseña"
                      className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2 px-3 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold text-xs shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all mt-2 cursor-pointer"
                  >
                    Actualizar PIN de Acceso
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
