/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Order, TicketConfig } from '../types';
import { Printer, X, Check, Copy } from 'lucide-react';

interface TicketModalProps {
  order: Order | null;
  config: TicketConfig;
  onClose: () => void;
}

export default function TicketModal({ order, config, onClose }: TicketModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  const isCanje = order.type === 'canje';

  const handleCopy = () => {
    const textElement = document.getElementById('thermal-ticket-content');
    if (textElement) {
      navigator.clipboard.writeText(textElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    // Simulated print
    const routingText = 
      config.printSetting === 'ticket_only' ? 'Solo Cliente' :
      config.printSetting === 'kitchen_only' ? 'Solo Cocina' :
      config.printSetting === 'both' ? 'Cliente + Cocina' : 'Cliente (Cocina KDS Digital)';
    
    alert(`[IMPRESORA TÉRMICA MOCK]
Tamaño de papel: ${config.ticketSize || '80mm'}
Copias solicitadas: ${config.copies || 1}
Enrutamiento: ${routingText}
Despachando impresión...`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="bg-white rounded-[1.75rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-delight-gray/10 flex justify-between items-center bg-[#FFFDF8]">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-delight-green" />
            <span className="font-bold text-delight-dark">
              {isCanje ? 'Ticket de Canje' : 'Ticket de Venta'}
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-delight-dark/5 text-delight-gray transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Thermal Body */}
        <div className="p-6 overflow-y-auto bg-gray-100/50 flex-1 flex justify-center">
          <div 
            id="thermal-ticket-content"
            className={`bg-white p-6 shadow-md border border-gray-200 w-full font-mono text-[11px] text-gray-800 leading-relaxed rounded-sm select-text`}
            style={{ 
              fontFamily: 'monospace',
              maxWidth: config.ticketSize === '58mm' ? '210px' : '290px',
              fontSize: config.ticketSize === '58mm' ? '9.5px' : '11px'
            }}
          >
            {/* Header Text */}
            <div className="text-center whitespace-pre-line border-b border-dashed border-gray-400 pb-3 mb-3">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2 rounded" referrerPolicy="no-referrer" />
              ) : (
                config.logoText && (
                  <span className="text-xl block mb-1">{config.logoText}</span>
                )
              )}
              <span className="font-bold text-[13px] block uppercase">{config.businessName || 'DELIGHT'}</span>
              <span className="font-bold block text-[9px] tracking-wide text-gray-500">FRAPPÉS & DRINKS</span>
              <span className="block mt-1 text-[9px] uppercase">{config.address}</span>
              <span className="block text-[9px]">TEL: {config.phone}</span>
              {config.whatsapp && (
                <span className="block text-[9px]">WHATSAPP: {config.whatsapp}</span>
              )}
              {config.instagram && (
                <span className="block text-[9px]">INSTAGRAM: {config.instagram}</span>
              )}
              {config.fiscalInfo && (
                <span className="block text-[8px] text-gray-500 mt-1 uppercase tracking-tighter">{config.fiscalInfo}</span>
              )}
              {isCanje && (
                <div className="mt-2 py-0.5 px-2 bg-delight-yellow/15 border border-delight-yellow/30 text-delight-dark text-[10px] font-bold inline-block rounded">
                  * TICKET DE CANJE *
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="space-y-0.5 border-b border-dashed border-gray-400 pb-3 mb-3">
              <div>TICKET #: <span className="font-bold">{order.ticketNumber}</span></div>
              <div>FECHA: {new Date(order.createdAt).toLocaleString()}</div>
              <div>CANAL: <span className="font-bold">{order.channel}</span></div>
              {config.showCashier && <div>CAJERO: {order.cashierName}</div>}
              {order.customerName && (
                <div className="mt-1 pt-1 border-t border-dotted border-gray-300">
                  CLIENTE: <span className="font-bold">{order.customerName.toUpperCase()}</span>
                  <br />
                  CLUB ID: <span className="font-bold">{order.customerId}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
              <div className="grid grid-cols-12 font-bold mb-1 border-b border-dotted border-gray-300 pb-0.5">
                <div className="col-span-1">C</div>
                <div className="col-span-8">DESCRIPCION</div>
                <div className="col-span-3 text-right">TOTAL</div>
              </div>
              <div className="space-y-1.5">
                {order.items.map((item) => (
                  <div key={item.id}>
                    <div className="grid grid-cols-12 items-start">
                      <div className="col-span-1 font-bold">{item.quantity}</div>
                      <div className="col-span-8">{item.name}</div>
                      <div className="col-span-3 text-right font-bold">
                        ${isCanje ? '0.00' : item.subtotal.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Modifiers (Extras) */}
                    {item.extras.map((extra, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-[10px] text-gray-500 pl-3">
                        <div className="col-span-1">+</div>
                        <div className="col-span-8">{extra}</div>
                        <div className="col-span-3 text-right">
                          ${isCanje ? '0.00' : item.extrasCost.toFixed(2)}
                        </div>
                      </div>
                    ))}

                    {/* Cubiertos */}
                    {item.selectedCubierto !== 'Ninguno' && (
                      <div className="grid grid-cols-12 text-[10px] text-gray-500 pl-3">
                        <div className="col-span-1">+</div>
                        <div className="col-span-8">Cubierto: {item.selectedCubierto}</div>
                        <div className="col-span-3 text-right">
                          ${isCanje ? '0.00' : item.cubiertosCost.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-0.5 border-b border-dashed border-gray-400 pb-3 mb-3 text-right">
              <div className="grid grid-cols-12">
                <div className="col-span-8 font-bold">SUBTOTAL:</div>
                <div className="col-span-4 font-bold">${isCanje ? '0.00' : order.subtotal.toFixed(2)}</div>
              </div>
              {order.discount > 0 && (
                <div className="grid grid-cols-12 text-red-600 font-bold">
                  <div className="col-span-8">DESCTO:</div>
                  <div className="col-span-4">-${order.discount.toFixed(2)}</div>
                </div>
              )}
              {config.showTax && (
                <div className="grid grid-cols-12 text-gray-500">
                  <div className="col-span-8">IVA ({config.taxPercent}%):</div>
                  <div className="col-span-4">
                    ${isCanje ? '0.00' : (order.total * (config.taxPercent / 100)).toFixed(2)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-12 text-[13px] font-bold pt-1 border-t border-dotted border-gray-300">
                <div className="col-span-8">TOTAL:</div>
                <div className="col-span-4">${isCanje ? '0.00' : order.total.toFixed(2)}</div>
              </div>
            </div>

            {/* Extra Info / Payment Method */}
            <div className="space-y-0.5 border-b border-dashed border-gray-400 pb-3 mb-3">
              <div>MÉTODO PAGO: <span className="font-bold">{order.paymentMethod.toUpperCase()}</span></div>
              {isCanje ? (
                <div className="text-delight-green font-bold">PUNTOS CANJEADOS: -{order.pointsUsed} pts</div>
              ) : (
                config.showPointsInfo && order.customerId && (
                  <div className="text-delight-green font-bold">
                    PUNTOS GENERADOS: +{order.pointsGenerated} pts
                  </div>
                )
              )}
            </div>

            {/* Print Routing & Copies Metadata on ticket */}
            <div className="text-[8px] text-gray-400 text-center uppercase tracking-wider space-y-0.5 border-b border-dashed border-gray-400 pb-2.5 mb-2.5">
              <div>Copia: 1 de {config.copies || 1}</div>
              <div>Impresión: {
                config.printSetting === 'ticket_only' ? 'Solo Cliente' :
                config.printSetting === 'kitchen_only' ? 'Solo Cocina' :
                config.printSetting === 'both' ? 'Cliente + Cocina' : 'Cliente (Cocina KDS Digital)'
              }</div>
              <div>Ancho Papel: {config.ticketSize || '80mm'}</div>
            </div>

            {/* Footer Text */}
            <div className="text-center whitespace-pre-line text-[9px] text-gray-500">
              {config.footerText}
            </div>
          </div>
        </div>

        {/* Buttons iPad-style */}
        <div className="p-5 border-t border-delight-gray/10 bg-[#FFFDF8] grid grid-cols-2 gap-3">
          <button
            type="button"
            id="copy-ticket-btn"
            onClick={handleCopy}
            className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all border ${
              copied 
                ? 'bg-delight-green/10 text-delight-green border-delight-green/30' 
                : 'bg-white text-delight-dark border-delight-gray/15 hover:bg-delight-dark/5'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-delight-green" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-delight-gray" />
                Copiar Texto
              </>
            )}
          </button>
          
          <button
            type="button"
            id="print-ticket-btn"
            onClick={handlePrint}
            className="py-3 px-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md shadow-delight-green/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>

      </div>
    </div>
  );
}
