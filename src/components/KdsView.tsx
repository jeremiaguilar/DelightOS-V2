/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Order, KdsStatus, SalesChannel } from '../types';
import { synth } from '../utils/audio';
import { 
  Clock, 
  Play, 
  Check, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Flame, 
  Inbox, 
  Printer, 
  CheckCircle,
  Filter
} from 'lucide-react';

interface KdsViewProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: KdsStatus) => void;
  onOpenTicket: (order: Order) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function KdsView({
  orders,
  onUpdateOrderStatus,
  onOpenTicket,
  soundEnabled,
  onToggleSound
}: KdsViewProps) {
  const [activeFilter, setActiveFilter] = useState<'activo' | 'pendiente' | 'preparacion' | 'listo'>('activo');
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Keep a ticking clock to update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'activo') return order.status === 'pendiente' || order.status === 'preparacion';
    return order.status === activeFilter;
  });

  // Sound triggering logic based on states
  // We can track played notifications in refs or a simple set to avoid duplicate spamming
  const playedUpcomingRef = React.useRef<Set<string>>(new Set());
  const playedDelayedRef = React.useRef<Set<string>>(new Set());

  // Check state transitions to trigger warnings
  useEffect(() => {
    if (!soundEnabled) return;

    orders.forEach((order) => {
      if (order.status !== 'pendiente' && order.status !== 'preparacion') return;

      const createdMs = new Date(order.createdAt).getTime();
      const elapsedSec = Math.floor((nowTime - createdMs) / 1000);
      const remainingSec = 18 * 60 - elapsedSec;

      // 1. Upcoming Expiry Warning (between 1 and 3 minutes left)
      if (remainingSec <= 180 && remainingSec > 0 && !playedUpcomingRef.current.has(order.id)) {
        synth.playUpcomingExpiry();
        playedUpcomingRef.current.add(order.id);
      }

      // 2. Overdue Warning (>18 mins elapsed)
      if (remainingSec <= 0 && !playedDelayedRef.current.has(order.id)) {
        synth.playDelayed();
        playedDelayedRef.current.add(order.id);
      }
    });
  }, [orders, nowTime, soundEnabled]);

  const handleStartPreparation = (orderId: string) => {
    onUpdateOrderStatus(orderId, 'preparacion');
  };

  const handleCompleteOrder = (orderId: string) => {
    if (soundEnabled) {
      synth.playReady(); // play fanfare!
    }
    onUpdateOrderStatus(orderId, 'listo');
  };

  const getTimerDisplay = (createdAtStr: string) => {
    const createdMs = new Date(createdAtStr).getTime();
    const elapsedSec = Math.floor((nowTime - createdMs) / 1000);
    const limitSec = 18 * 60; // 18 minutes in seconds
    const diff = limitSec - elapsedSec;

    if (diff >= 0) {
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      const progressPercent = (diff / limitSec) * 100;
      
      return {
        text: `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isAtrasado: false,
        isWarning: diff <= 180, // under 3 minutes
        progressPercent,
        label: 'tiempo restante'
      };
    } else {
      const over = Math.abs(diff);
      const m = Math.floor(over / 60);
      const s = over % 60;
      return {
        text: `+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isAtrasado: true,
        isWarning: false,
        progressPercent: 0,
        label: 'atraso acumulado'
      };
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] p-5 font-sans flex flex-col bg-[#FFFDF8] select-none overflow-hidden">
      
      {/* KDS Control Header */}
      <div className="flex justify-between items-center mb-5 shrink-0 bg-white p-4 rounded-2xl border border-delight-gray/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 p-1 bg-delight-dark/5 rounded-xl">
            <button
              type="button"
              id="kds-filter-active"
              onClick={() => setActiveFilter('activo')}
              className={`py-2 px-4 rounded-lg font-bold text-xs transition-all ${
                activeFilter === 'activo'
                  ? 'bg-white text-delight-dark shadow-sm'
                  : 'text-delight-gray/70 hover:text-delight-dark'
              }`}
            >
              Cola Activa (Pendiente/Preparación)
            </button>
            <button
              type="button"
              id="kds-filter-pending"
              onClick={() => setActiveFilter('pendiente')}
              className={`py-2 px-4 rounded-lg font-bold text-xs transition-all ${
                activeFilter === 'pendiente'
                  ? 'bg-white text-delight-dark shadow-sm'
                  : 'text-delight-gray/70 hover:text-delight-dark'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              id="kds-filter-cooking"
              onClick={() => setActiveFilter('preparacion')}
              className={`py-2 px-4 rounded-lg font-bold text-xs transition-all ${
                activeFilter === 'preparacion'
                  ? 'bg-white text-delight-dark shadow-sm'
                  : 'text-delight-gray/70 hover:text-delight-dark'
              }`}
            >
              En Preparación
            </button>
            <button
              type="button"
              id="kds-filter-ready"
              onClick={() => setActiveFilter('listo')}
              className={`py-2 px-4 rounded-lg font-bold text-xs transition-all ${
                activeFilter === 'listo'
                  ? 'bg-white text-delight-dark shadow-sm'
                  : 'text-delight-gray/70 hover:text-delight-dark'
              }`}
            >
              Listos
            </button>
          </div>
        </div>

        {/* Audio Volume configuration panel */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest">Sonidos de Cocina</span>
          <button
            type="button"
            id="kds-audio-toggle"
            onClick={onToggleSound}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs cursor-pointer ${
              soundEnabled
                ? 'bg-delight-green/10 text-delight-green border-delight-green/20'
                : 'bg-red-50 text-red-500 border-red-200/60'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4.5 h-4.5 text-delight-green animate-pulse" />
                Audio Activo
              </>
            ) : (
              <>
                <VolumeX className="w-4.5 h-4.5 text-red-500" />
                Muteado
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Kitchen Tickets */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-delight-gray/10 p-10">
            <Inbox className="w-16 h-16 text-delight-gray/10 mb-4" />
            <h3 className="text-sm font-bold text-delight-gray">No hay comandas en este estado.</h3>
            <p className="text-[11px] text-delight-gray/40 mt-1">Los nuevos pedidos ingresarán aquí en tiempo real.</p>
          </div>
        ) : (
          <div className="flex gap-5 h-full items-start pr-10">
            {filteredOrders.map((order) => {
              const timer = getTimerDisplay(order.createdAt);
              const isEspecial = order.channel === SalesChannel.ESPECIAL;

              // Card styling depending on status and warning timer levels
              let cardBorderClass = 'border-delight-gray/10';
              let headerBgClass = 'bg-gray-50';
              let badgeTextClass = 'text-delight-gray bg-delight-gray/10';
              
              if (order.status === 'pendiente') {
                cardBorderClass = 'border-delight-yellow/40 hover:border-delight-yellow';
                headerBgClass = 'bg-delight-yellow/5';
                badgeTextClass = 'text-delight-yellow bg-delight-yellow/10';
              } else if (order.status === 'preparacion') {
                cardBorderClass = 'border-delight-green/40 hover:border-delight-green';
                headerBgClass = 'bg-delight-green/5';
                badgeTextClass = 'text-delight-green bg-delight-green/10';
              }

              if (timer.isAtrasado) {
                cardBorderClass = 'border-red-500 animate-pulse';
                headerBgClass = 'bg-red-50';
              } else if (timer.isWarning) {
                cardBorderClass = 'border-orange-400 animate-pulse';
                headerBgClass = 'bg-orange-50';
              }

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl w-[320px] flex flex-col max-h-full border-2 ${cardBorderClass} shadow-lg shadow-delight-dark/2 overflow-hidden shrink-0 transition-all`}
                >
                  
                  {/* Ticket Header */}
                  <div className={`p-4 border-b border-delight-gray/10 ${headerBgClass} shrink-0`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-base font-black text-delight-dark tracking-tight">{order.ticketNumber}</h4>
                        <span className="text-[10px] font-bold text-delight-gray uppercase tracking-widest mt-0.5 block">
                          Canal: <strong className="text-delight-dark">{order.channel}</strong>
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeTextClass}`}>
                          {order.status === 'preparacion' ? 'en cocina' : order.status}
                        </span>
                        {isEspecial && (
                          <span className="text-[9px] font-bold uppercase text-red-500 bg-red-50 border border-red-200/50 block mt-1 px-1.5 py-0.5 rounded">
                            Descuento Especial
                          </span>
                        )}
                        {order.type === 'canje' && (
                          <span className="text-[9px] font-bold uppercase text-delight-yellow bg-delight-yellow/10 border border-delight-yellow/30 block mt-1 px-1.5 py-0.5 rounded">
                            🎁 Canje Club
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 18-minute timer visual tracking bar */}
                    <div className="mt-3.5 bg-delight-dark/5 p-3 rounded-2xl border border-delight-gray/5 flex justify-between items-center relative overflow-hidden">
                      {order.status !== 'listo' && (
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                            timer.isAtrasado 
                              ? 'bg-red-500/10 w-full' 
                              : timer.isWarning 
                              ? 'bg-orange-400/15' 
                              : 'bg-delight-green/10'
                          }`}
                          style={{ width: `${timer.isAtrasado ? 100 : timer.progressPercent}%` }}
                        />
                      )}
                      
                      <div className="z-10 flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${timer.isAtrasado ? 'text-red-500 animate-spin' : timer.isWarning ? 'text-orange-500 animate-pulse' : 'text-delight-green'}`} />
                        <span className={`text-base font-black tracking-tight ${timer.isAtrasado ? 'text-red-500' : timer.isWarning ? 'text-orange-600' : 'text-delight-dark'}`}>
                          {timer.text}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-delight-gray/50 z-10">{timer.label}</span>
                    </div>
                  </div>

                  {/* Food items recipe details */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-dotted divide-delight-gray/10">
                    {order.items.map((item, index) => (
                      <div key={item.id} className={`${index > 0 ? 'pt-3.5' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-1">
                            <span className="text-sm font-black text-delight-dark leading-snug">
                              {item.quantity}x {item.name}
                            </span>
                            
                            {/* Extras details */}
                            {item.extras.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.extras.map((extra, exIdx) => (
                                  <span key={exIdx} className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded uppercase">
                                    + {extra}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Cubiertos selection */}
                            {item.selectedCubierto !== 'Ninguno' && (
                              <div className="mt-1">
                                <span className="text-[9px] font-bold text-delight-gray bg-delight-dark/5 px-1.5 py-0.5 rounded uppercase">
                                  🍴 Cubierto: {item.selectedCubierto}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* KDS actions drawer */}
                  <div className="p-4 bg-gray-50 border-t border-delight-gray/10 flex justify-between gap-2.5 shrink-0">
                    <button
                      type="button"
                      id={`ticket-btn-${order.id}`}
                      onClick={() => onOpenTicket(order)}
                      className="py-2.5 px-3 bg-white border border-delight-gray/15 rounded-xl hover:bg-delight-dark/5 text-delight-gray transition-colors text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      title="Ver Ticket de Comanda"
                    >
                      <Printer className="w-4 h-4 text-delight-gray" />
                      Ticket
                    </button>

                    {order.status === 'pendiente' && (
                      <button
                        type="button"
                        id={`prep-btn-${order.id}`}
                        onClick={() => handleStartPreparation(order.id)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-delight-yellow to-delight-yellow-hover text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow shadow-delight-yellow/15 hover:shadow-md cursor-pointer active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 text-white shrink-0" />
                        Cocinar
                      </button>
                    )}

                    {order.status === 'preparacion' && (
                      <button
                        type="button"
                        id={`done-btn-${order.id}`}
                        onClick={() => handleCompleteOrder(order.id)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow shadow-delight-green/15 hover:shadow-md cursor-pointer active:scale-95 transition-all animate-pulse"
                      >
                        <Check className="w-4 h-4 text-white shrink-0" />
                        Completar
                      </button>
                    )}

                    {order.status === 'listo' && (
                      <div className="flex-1 flex items-center justify-center gap-1 bg-delight-green/10 text-delight-green py-2 rounded-xl text-xs font-bold">
                        <CheckCircle className="w-4.5 h-4.5 text-delight-green" />
                        Completado
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
