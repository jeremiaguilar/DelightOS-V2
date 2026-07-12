/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Order, Reward } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  PlusCircle, 
  Coins, 
  Edit3, 
  Calendar, 
  Phone, 
  User, 
  Check, 
  QrCode, 
  Clock, 
  TrendingUp, 
  X,
  Sparkles,
  ShoppingBag,
  Camera,
  History
} from 'lucide-react';

interface ClubDelightViewProps {
  customers: Customer[];
  orders: Order[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  rewards: Reward[];
}

export default function ClubDelightView({ customers, orders, onAddCustomer, onUpdateCustomer, rewards }: ClubDelightViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'purchases' | 'points' | 'last_purchase'>('profile');
  
  // Registration and Edit form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBirthdate, setFormBirthdate] = useState('');
  const [error, setError] = useState('');

  // Simulated QR Code Scan Overlay State
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState<string | null>(null);

  // Auto-reset subtab when selected customer changes
  useEffect(() => {
    setActiveSubTab('profile');
  }, [selectedCustomer]);

  // Filter customers matching query by Name, ID, Phone, or QR code
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(c => 
      `${c.name} ${c.lastName}`.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.qrCode && c.qrCode.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Extract selected customer's orders history
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => o.customerId === selectedCustomer.id);
  }, [orders, selectedCustomer]);

  // Extract customer's points adjustment ledger
  const pointsHistory = useMemo(() => {
    return customerOrders.map(ord => {
      const isRedemption = ord.type === 'canje';
      const points = isRedemption ? -ord.pointsUsed : ord.pointsGenerated;
      return {
        id: ord.id,
        date: ord.createdAt,
        ticket: ord.ticketNumber,
        type: isRedemption ? 'Canje de Premio' : 'Acumulación por Compra',
        points,
        description: isRedemption 
          ? `Recompensa canjeada por puntos` 
          : `Compra en canal ${ord.channel}`
      };
    }).filter(entry => entry.points !== 0);
  }, [customerOrders]);

  // Extract selected customer's absolute last purchase details
  const lastPurchase = useMemo(() => {
    if (customerOrders.length === 0) return null;
    return [...customerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [customerOrders]);

  // Open Add modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormName('');
    setFormLastName('');
    setFormPhone('');
    setFormBirthdate('');
    setError('');
    setShowAddModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (customer: Customer) => {
    setIsEditing(true);
    setFormName(customer.name);
    setFormLastName(customer.lastName);
    setFormPhone(customer.phone);
    setFormBirthdate(customer.birthdate);
    setError('');
    setShowAddModal(true);
  };

  // Simulated QR Scan Action
  const handleSimulateQrScan = (code: string) => {
    const matched = customers.find(c => c.qrCode.toLowerCase() === code.toLowerCase() || c.id.toLowerCase() === code.toLowerCase());
    if (matched) {
      setQrScanSuccess(`¡Código QR "${code}" escaneado con éxito!`);
      setSelectedCustomer(matched);
      setTimeout(() => {
        setQrScanSuccess(null);
        setShowQrScanner(false);
      }, 1200);
    } else {
      alert(`Código QR "${code}" no registrado en Club DELIGHT.`);
    }
  };

  // Save Customer (Add or Update)
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formName.trim() || !formLastName.trim() || !formPhone.trim() || !formBirthdate) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    if (formPhone.replace(/\D/g, '').length < 10) {
      setError('El teléfono debe tener un formato de 10 dígitos.');
      return;
    }

    if (isEditing && selectedCustomer) {
      // Update
      const updated: Customer = {
        ...selectedCustomer,
        name: formName.trim(),
        lastName: formLastName.trim(),
        phone: formPhone.trim(),
        birthdate: formBirthdate
      };
      onUpdateCustomer(updated);
      setSelectedCustomer(updated); // Sync details pane
    } else {
      // Add new Customer
      // Auto-generate ID: Find highest number and increment
      const ids = customers.map(c => parseInt(c.id.split('-')[1] || '100'));
      const maxId = Math.max(...ids, 106);
      const nextId = `DL-0${maxId + 1}`;

      const newCust: Customer = {
        id: nextId,
        name: formName.trim(),
        lastName: formLastName.trim(),
        phone: formPhone.trim(),
        birthdate: formBirthdate,
        qrCode: `CLUB-${nextId}`,
        registrationDate: new Date().toISOString().split('T')[0],
        totalSpent: 0,
        totalPurchases: 0,
        pointsAccumulated: 0,
        pointsRedeemed: 0,
        pointsAvailable: 0
      };
      onAddCustomer(newCust);
      setSelectedCustomer(newCust); // auto focus details on newly registered
    }

    setShowAddModal(false);
  };

  return (
    <div className="h-[calc(100vh-64px)] p-3 lg:p-5 font-sans flex flex-col lg:grid lg:grid-cols-12 gap-5 select-none overflow-hidden bg-[#FFFDF8] overflow-y-auto lg:overflow-hidden">
      
      {/* Left List of Customers (Excel base modern look - 7 columns) */}
      <div className="lg:col-span-7 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col shrink-0 lg:h-full">
        
        {/* Module Header and Search */}
        <div className="p-5 border-b border-delight-gray/10 flex justify-between items-center bg-[#FFFDF8] shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5.5 h-5.5 text-delight-green" />
            <h3 className="font-extrabold text-delight-dark text-base">Club DELIGHT Base</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQrScanner(true)}
              className="py-2.5 px-3.5 bg-delight-green/10 text-delight-green border border-delight-green/25 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-delight-green/15 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              Escanear QR
            </button>

            <button
              type="button"
              id="register-member-btn"
              onClick={handleOpenAdd}
              className="py-2.5 px-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow shadow-delight-green/15 hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Nuevo Socio
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-3.5 border-b border-delight-gray/10 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-delight-gray/40 w-4 h-4" />
            <input
              type="text"
              id="club-member-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
              placeholder="Buscar por ID, nombre, teléfono o código QR..."
            />
          </div>
        </div>

        {/* Modern styled Spreadsheet list */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-10 text-center">
              <Search className="w-10 h-10 text-delight-gray/15 mx-auto mb-2" />
              <p className="text-xs font-bold text-delight-gray/50">No se encontraron socios.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-delight-dark/5 text-[9px] font-bold uppercase tracking-wider text-delight-gray sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4">ID Club</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4 text-center">Puntos Disponibles</th>
                  <th className="py-3 px-4 text-right">Gastado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-delight-gray/5 text-xs text-delight-dark font-semibold">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    id={`row-member-${cust.id}`}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`hover:bg-delight-green/5 transition-colors cursor-pointer ${
                      selectedCustomer?.id === cust.id ? 'bg-delight-green/5 border-l-4 border-l-delight-green' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-delight-green">{cust.id}</td>
                    <td className="py-3.5 px-4">{cust.name} {cust.lastName}</td>
                    <td className="py-3.5 px-4 font-mono text-delight-gray">{cust.phone}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-delight-yellow/10 text-delight-yellow font-extrabold px-2.5 py-1 rounded-full text-[11px]">
                        <Coins className="w-3.5 h-3.5" />
                        {cust.pointsAvailable}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-delight-dark font-extrabold">${cust.totalSpent.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Customer Card Details (5 columns) */}
      <div className="col-span-5 flex flex-col h-full gap-5">
        
        {/* Selected Customer Details */}
        <div className="flex-1 bg-white rounded-[2rem] border border-delight-gray/10 shadow-xl overflow-hidden flex flex-col">
          {selectedCustomer ? (
            <div className="p-6 flex flex-col h-full overflow-hidden">
              
              {/* Header card details */}
              <div className="flex justify-between items-start pb-4 border-b border-delight-gray/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-delight-green/10 text-delight-green flex items-center justify-center font-extrabold text-base">
                    {selectedCustomer.name[0]}{selectedCustomer.lastName[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-delight-dark">{selectedCustomer.name} {selectedCustomer.lastName}</h4>
                    <span className="text-[10px] font-bold text-delight-green uppercase bg-delight-green/10 px-2.5 py-0.5 rounded-md inline-block mt-1">
                      Socio {selectedCustomer.id}
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  id="edit-customer-btn"
                  onClick={() => handleOpenEdit(selectedCustomer)}
                  className="p-2 border border-delight-gray/15 rounded-xl text-delight-gray hover:bg-delight-dark/5 hover:text-delight-dark transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-navigation tabs */}
              <div className="flex gap-1 border-b border-delight-gray/5 pb-2 pt-3 shrink-0 overflow-x-auto">
                <button 
                  onClick={() => setActiveSubTab('profile')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    activeSubTab === 'profile' ? 'bg-delight-green text-white shadow-sm' : 'bg-delight-dark/5 text-delight-gray hover:text-delight-dark'
                  }`}
                >
                  Perfil
                </button>
                <button 
                  onClick={() => setActiveSubTab('purchases')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                    activeSubTab === 'purchases' ? 'bg-delight-green text-white shadow-sm' : 'bg-delight-dark/5 text-delight-gray hover:text-delight-dark'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  Compras ({customerOrders.length})
                </button>
                <button 
                  onClick={() => setActiveSubTab('points')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                    activeSubTab === 'points' ? 'bg-delight-green text-white shadow-sm' : 'bg-delight-dark/5 text-delight-gray hover:text-delight-dark'
                  }`}
                >
                  <History className="w-3 h-3" />
                  Puntos
                </button>
                <button 
                  onClick={() => setActiveSubTab('last_purchase')}
                  className={`py-1 px-3.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                    activeSubTab === 'last_purchase' ? 'bg-delight-green text-white shadow-sm' : 'bg-delight-dark/5 text-delight-gray hover:text-delight-dark'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Última
                </button>
              </div>

              {/* Tab Panel Contents */}
              <div className="flex-1 overflow-y-auto pt-4">
                
                {activeSubTab === 'profile' && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Core stat counters (Bento elements) */}
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="p-4 bg-gradient-to-r from-delight-green/5 to-white rounded-2xl border border-delight-green/15 text-left">
                        <span className="text-[9px] font-bold text-delight-gray uppercase tracking-widest block mb-1">Puntos Disponibles</span>
                        <div className="flex items-center gap-1 text-delight-green">
                          <Coins className="w-5.5 h-5.5 text-delight-yellow shrink-0" />
                          <span className="text-xl font-extrabold text-delight-dark">{selectedCustomer.pointsAvailable}</span>
                        </div>
                        <span className="text-[9px] text-delight-gray/60 block mt-1">Acumulados: {selectedCustomer.pointsAccumulated}</span>
                      </div>

                      <div className="p-4 bg-[#FFFDF8] rounded-2xl border border-delight-gray/10 text-left">
                        <span className="text-[9px] font-bold text-delight-gray uppercase tracking-widest block mb-1">Consumo Total</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-extrabold text-delight-dark">${selectedCustomer.totalSpent.toFixed(2)}</span>
                        </div>
                        <span className="text-[9px] text-delight-gray/60 block mt-1">Visitas totales: {selectedCustomer.totalPurchases}</span>
                      </div>
                    </div>

                    {/* CRM logs metadata */}
                    <div className="bg-delight-dark/5 p-4 rounded-2xl space-y-3 font-semibold text-xs text-delight-gray">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-delight-gray/60" /> Nacimiento:</span>
                        <span className="text-delight-dark font-mono">{selectedCustomer.birthdate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-delight-gray/60" /> Teléfono:</span>
                        <span className="text-delight-dark font-mono">{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-delight-gray/60" /> Fecha Registro:</span>
                        <span className="text-delight-dark font-mono">{selectedCustomer.registrationDate}</span>
                      </div>
                    </div>

                    {/* Beautiful, responsive simulated vector QR Code */}
                    <div className="p-4 border border-dashed border-delight-gray/15 rounded-[1.5rem] flex flex-col items-center justify-center bg-gray-50/50">
                      <QrCode className="w-7 h-7 text-delight-dark/40 mb-2" />
                      <div className="w-32 h-32 bg-white p-2 rounded-xl border border-gray-200 flex items-center justify-center shadow-inner relative">
                        <svg viewBox="0 0 100 100" className="w-28 h-28 text-delight-dark">
                          <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                          <rect x="5" y="5" width="15" height="15" fill="white" />
                          <rect x="8" y="8" width="9" height="9" fill="currentColor" />
                          
                          <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                          <rect x="80" y="5" width="15" height="15" fill="white" />
                          <rect x="83" y="8" width="9" height="9" fill="currentColor" />
                          
                          <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                          <rect x="5" y="80" width="15" height="15" fill="white" />
                          <rect x="8" y="83" width="9" height="9" fill="currentColor" />

                          <rect x="35" y="10" width="10" height="5" fill="currentColor" />
                          <rect x="45" y="25" width="5" height="15" fill="currentColor" />
                          <rect x="15" y="45" width="15" height="5" fill="currentColor" />
                          <rect x="60" y="35" width="10" height="10" fill="currentColor" />
                          <rect x="55" y="60" width="5" height="5" fill="currentColor" />
                          <rect x="40" y="70" width="15" height="15" fill="currentColor" />
                          <rect x="70" y="65" width="20" height="10" fill="currentColor" />
                          <rect x="65" y="80" width="10" height="10" fill="currentColor" />
                          <rect x="85" y="45" width="10" height="10" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-delight-gray/50 mt-2 uppercase tracking-widest">
                        {selectedCustomer.qrCode}
                      </span>
                    </div>
                  </div>
                )}

                {activeSubTab === 'purchases' && (
                  <div className="space-y-3 animate-fade-in overflow-y-auto max-h-[380px] pr-1">
                    {customerOrders.length === 0 ? (
                      <div className="py-12 text-center text-xs font-bold text-delight-gray/40">
                        No hay historial de compras para este socio.
                      </div>
                    ) : (
                      customerOrders.map(ord => (
                        <div key={ord.id} className="border border-delight-gray/5 p-3.5 rounded-2xl bg-delight-dark/5 space-y-1.5 font-semibold text-xs text-delight-dark">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-black text-delight-green">{ord.ticketNumber}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                              ord.type === 'canje' ? 'bg-delight-yellow/15 text-delight-yellow' : 'bg-delight-green/10 text-delight-green'
                            }`}>
                              {ord.type === 'canje' ? 'Canje' : ord.channel}
                            </span>
                          </div>
                          
                          <div className="text-[10px] text-delight-gray space-y-0.5 leading-relaxed">
                            <div>Fecha: {new Date(ord.createdAt).toLocaleString()}</div>
                            <div>Cajero: {ord.cashierName} • Pago: <span className="uppercase">{ord.paymentMethod}</span></div>
                          </div>

                          <div className="pt-1.5 border-t border-delight-gray/5 text-[10px] text-delight-gray">
                            Items: <span className="font-bold text-delight-dark">{ord.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}</span>
                          </div>

                          <div className="flex justify-between text-[11px] font-extrabold pt-1 text-right">
                            <span>TOTAL:</span>
                            <span>${ord.type === 'canje' ? '0.00' : ord.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeSubTab === 'points' && (
                  <div className="space-y-3 animate-fade-in overflow-y-auto max-h-[380px] pr-1">
                    {pointsHistory.length === 0 ? (
                      <div className="py-12 text-center text-xs font-bold text-delight-gray/40">
                        No se registran movimientos de puntos todavía.
                      </div>
                    ) : (
                      pointsHistory.map(entry => (
                        <div key={entry.id} className="p-3 bg-white border border-delight-gray/10 rounded-2xl flex justify-between items-center text-xs font-semibold">
                          <div>
                            <div className="font-black text-delight-dark">{entry.type}</div>
                            <div className="text-[10px] text-delight-gray/60 mt-0.5">{entry.description}</div>
                            <div className="text-[9px] text-delight-gray/40 font-mono mt-1">{new Date(entry.date).toLocaleString()} • Ticket {entry.ticket}</div>
                          </div>
                          <div className={`text-sm font-black shrink-0 ${entry.points > 0 ? 'text-delight-green' : 'text-red-500'}`}>
                            {entry.points > 0 ? `+${entry.points}` : entry.points} pts
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeSubTab === 'last_purchase' && (
                  <div className="animate-fade-in">
                    {!lastPurchase ? (
                      <div className="py-12 text-center text-xs font-bold text-delight-gray/40">
                        Este cliente no tiene compras registradas.
                      </div>
                    ) : (
                      <div className="border border-delight-green/15 rounded-2xl p-4.5 space-y-3.5 bg-gradient-to-br from-white to-[#FFFDF8] text-xs font-semibold">
                        <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-gray-200">
                          <div>
                            <span className="text-[9px] text-delight-gray uppercase tracking-wider block">Último Consumo</span>
                            <span className="font-mono text-sm font-black text-delight-dark">{lastPurchase.ticketNumber}</span>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            lastPurchase.type === 'canje' ? 'bg-delight-yellow/10 text-delight-yellow' : 'bg-delight-green/10 text-delight-green'
                          }`}>
                            {lastPurchase.type === 'canje' ? 'Canje' : lastPurchase.channel}
                          </span>
                        </div>

                        <div className="space-y-1 text-[10px] text-delight-gray">
                          <div>Fecha: <strong className="text-delight-dark font-mono">{new Date(lastPurchase.createdAt).toLocaleString()}</strong></div>
                          <div>Cajero: <strong className="text-delight-dark">{lastPurchase.cashierName}</strong></div>
                          <div>Método Pago: <strong className="text-delight-dark uppercase">{lastPurchase.paymentMethod}</strong></div>
                        </div>

                        <div className="py-2.5 border-y border-dotted border-gray-200 space-y-1 text-[10px]">
                          {lastPurchase.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-delight-dark font-bold">
                              <span>{it.quantity}x {it.name}</span>
                              <span>{lastPurchase.type === 'canje' ? '0 pts' : `$${it.subtotal.toFixed(2)}`}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-1 font-black text-xs text-delight-dark">
                          <span>TOTAL:</span>
                          <span className="text-delight-green text-sm">${lastPurchase.type === 'canje' ? '0.00' : lastPurchase.total.toFixed(2)}</span>
                        </div>

                        <div className="text-[9px] text-delight-gray/50 italic text-center">
                          {lastPurchase.type === 'canje' ? 'Recompensas canjeadas libres de costo' : `Operación de venta oficial del Club Delight`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/20">
              <User className="w-16 h-16 text-delight-gray/10 mb-3" />
              <h4 className="text-sm font-bold text-delight-gray">Detalles de Socio</h4>
              <p className="text-[11px] text-delight-gray/40 mt-1 max-w-xs">Seleccione un socio de la lista para ver su perfil completo, consultar puntos disponibles, e historial detallado de consumos.</p>
            </div>
          )}
        </div>

        {/* Rewards Point Catalogue Sidebar Reference */}
        <div className="bg-white rounded-[2rem] border border-delight-gray/10 shadow-lg p-5 shrink-0">
          <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-delight-gray/5">
            <Coins className="w-5 h-5 text-delight-yellow" />
            <span className="font-bold text-xs text-delight-dark uppercase tracking-wider">Catálogo de Premios Oficial</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
            {rewards.filter(r => r.active).map((rew) => (
              <div 
                key={rew.id} 
                className="bg-delight-yellow/5 p-2.5 rounded-xl border border-delight-yellow/15 flex justify-between items-center"
              >
                <span className="text-[10px] font-bold text-delight-dark">{rew.name}</span>
                <span className="text-[10px] font-black text-delight-yellow shrink-0">{rew.points} pts</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveCustomer}
            className="bg-white rounded-[2rem] w-full max-w-md p-7 shadow-2xl space-y-5"
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-delight-dark">
                {isEditing ? 'Editar Perfil de Socio' : 'Registrar Nuevo Socio'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/60 rounded-xl p-3 text-[11px] text-red-700 font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Nombre</label>
                <input
                  type="text"
                  required
                  id="form-customer-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
                  placeholder="Ej. Juan"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Apellido</label>
                <input
                  type="text"
                  required
                  id="form-customer-lastname"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all"
                  placeholder="Ej. Pérez"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Teléfono Móvil (10 dígitos)</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  id="form-customer-phone"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all font-mono"
                  placeholder="Ej. 8112345678"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-delight-gray uppercase tracking-widest mb-1.5 ml-1">Fecha de Nacimiento</label>
                <input
                  type="date"
                  required
                  id="form-customer-birthdate"
                  value={formBirthdate}
                  onChange={(e) => setFormBirthdate(e.target.value)}
                  className="w-full bg-delight-dark/5 border border-transparent rounded-xl py-3 px-4 text-xs font-semibold outline-none focus:bg-white focus:border-delight-green/30 focus:ring-4 focus:ring-delight-green/5 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              id="submit-customer-form-btn"
              className="w-full py-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-6"
            >
              <Check className="w-4.5 h-4.5" />
              {isEditing ? 'Guardar Cambios' : 'Registrar Socio'}
            </button>
          </form>
        </div>
      )}

      {/* SIMULATED QR CAMERA SCANNER DIALOG OVERLAY */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 overflow-hidden shadow-2xl space-y-5 border border-delight-green/10 flex flex-col items-center text-center">
            
            <div className="w-full flex justify-between items-center border-b border-delight-gray/5 pb-3">
              <span className="font-extrabold text-sm text-delight-dark">Escáner de Socios QR</span>
              <button 
                onClick={() => setShowQrScanner(false)}
                className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {qrScanSuccess ? (
              <div className="py-12 space-y-3 flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-delight-green/10 text-delight-green flex items-center justify-center">
                  <Check className="w-10 h-10" />
                </div>
                <h4 className="text-sm font-black text-delight-green">{qrScanSuccess}</h4>
                <p className="text-[11px] text-delight-gray/50">Cargando perfil de socio...</p>
              </div>
            ) : (
              <div className="w-full space-y-5">
                {/* Simulated Camera Video Frame with flashing laser beam */}
                <div className="relative w-64 h-64 bg-black/5 rounded-[2rem] border-4 border-delight-green/45 flex flex-col items-center justify-center mx-auto overflow-hidden shadow-inner">
                  <Camera className="w-10 h-10 text-delight-gray/25 absolute animate-bounce" />
                  
                  {/* Flashing scan beam */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-delight-green via-white to-delight-green opacity-80 shadow-md shadow-delight-green animate-scan-beam" />
                  
                  <div className="text-[10px] text-delight-gray/45 font-bold uppercase mt-12 tracking-wider absolute bottom-6">
                    Alinee código QR
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-delight-dark">Simular Lectura de Código</h4>
                  <p className="text-[11px] text-delight-gray/60 px-4">Seleccione una tarjeta digital de socio para simular la lectura del código de barras / QR:</p>
                  
                  {/* Grid list of mock QR links */}
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border border-delight-gray/5 rounded-xl bg-gray-50/50">
                    {customers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSimulateQrScan(c.qrCode)}
                        className="p-2 bg-white hover:bg-delight-green/10 hover:border-delight-green/30 border border-delight-gray/10 rounded-lg text-left text-[10px] font-bold text-delight-dark transition-all cursor-pointer truncate"
                      >
                        <div className="truncate">{c.name} {c.lastName}</div>
                        <div className="font-mono text-delight-green text-[9px] mt-0.5">{c.qrCode}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
