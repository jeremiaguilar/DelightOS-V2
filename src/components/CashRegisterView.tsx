import React, { useState, useEffect } from 'react';
import { useCashRegisterContext } from '../contexts/CashRegisterContext';
import { Coins, ArrowDownToLine, ArrowUpFromLine, FileText, CheckCircle } from 'lucide-react';
import { useOrderContext } from '../contexts/OrderContext';
import { useUserContext } from '../contexts/UserContext';

export default function CashRegisterView() {
  const { activeRegister, closeRegister, history } = useCashRegisterContext();
  const { orders } = useOrderContext();
  const { currentUser } = useUserContext();
  
  const [movementType, setMovementType] = useState<'IN'|'OUT'>('OUT');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [movements, setMovements] = useState<any[]>([]); // We would ideally load from supabase

  // Load movements from local storage for mock (since we might not have a table)
  useEffect(() => {
    if (activeRegister) {
      const stored = localStorage.getItem(`cash_movements_${activeRegister.id}`);
      if (stored) {
        setMovements(JSON.parse(stored));
      }
    }
  }, [activeRegister]);

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRegister || !amount || !reason) return;
    
    const mov = {
      id: crypto.randomUUID(),
      type: movementType,
      amount: parseFloat(amount),
      reason,
      createdAt: new Date().toISOString(),
      user: currentUser?.name
    };
    
    const newMovs = [mov, ...movements];
    setMovements(newMovs);
    localStorage.setItem(`cash_movements_${activeRegister.id}`, JSON.stringify(newMovs));
    
    setAmount('');
    setReason('');
    alert("Movimiento registrado");
  };

  if (!activeRegister) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#FFFDF8]">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-4">
          <Coins className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-delight-dark uppercase">No hay caja abierta</h2>
        <p className="text-delight-gray/70 mt-2 max-w-sm">Abre la caja desde el Punto de Venta para comenzar a registrar movimientos.</p>
      </div>
    );
  }

  // Calculate metrics
  const sessionOrders = orders.filter(o => new Date(o.createdAt) >= new Date(activeRegister.openedAt));
  
  const ventasEfectivo = sessionOrders.filter(o => o.paymentMethod === 'efectivo').reduce((acc, o) => acc + o.total, 0);
  const ventasTarjeta = sessionOrders.filter(o => o.paymentMethod === 'tarjeta').reduce((acc, o) => acc + o.total, 0);
  const ventasTransferencia = sessionOrders.filter(o => o.paymentMethod === 'transferencia').reduce((acc, o) => acc + o.total, 0);
  const ventasUber = sessionOrders.filter(o => o.paymentMethod === 'plataforma' && o.channel === 'UBER').reduce((acc, o) => acc + o.total, 0);
  const ventasDidi = sessionOrders.filter(o => o.paymentMethod === 'plataforma' && o.channel === 'DIDI').reduce((acc, o) => acc + o.total, 0);
  
  const totalVendido = ventasEfectivo + ventasTarjeta + ventasTransferencia + ventasUber + ventasDidi;
  
  const entradas = movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.amount, 0);
  const retiros = movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.amount, 0);
  
  const canjesCount = sessionOrders.filter(o => o.type === 'canje').length;
  const canceladosCount = sessionOrders.filter(o => o.status === 'cancelado').length;
  
  const expectedCash = activeRegister.initialFloat + ventasEfectivo + entradas - retiros;

  const handleClose = () => {
    const counted = prompt(`Ingresa el efectivo contado en caja (Efectivo esperado: $${expectedCash.toFixed(2)})`);
    if (!counted) return;
    const countedCash = parseFloat(counted);
    if (isNaN(countedCash)) {
      alert("Cantidad inválida");
      return;
    }
    
    closeRegister({
      expectedCash,
      countedCash,
      difference: countedCash - expectedCash,
      notes: 'Cierre manual',
      ventasEfectivo,
      ventasTarjeta,
      ventasTransferencia,
      ventasUberPlataforma: ventasUber,
      ventasDidiPlataforma: ventasDidi,
      ventasDidiEfectivo: 0,
      canjesCount,
      canceladosCount,
      entradas,
      retiros
    });
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-gray-50/50 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-delight-dark uppercase tracking-tight">Caja Actual</h2>
          <p className="text-sm font-medium text-delight-gray/60">Responsable: {activeRegister.openedByName}</p>
        </div>
        <button
          onClick={handleClose}
          className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider text-sm flex items-center gap-2 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          <CheckCircle className="w-5 h-5" />
          Realizar Cierre de Caja
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Fondo Inicial</p>
          <p className="text-2xl font-black text-delight-dark">${activeRegister.initialFloat.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas Efectivo</p>
          <p className="text-2xl font-black text-green-600">+${ventasEfectivo.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Total Entradas</p>
          <p className="text-2xl font-black text-blue-600">+${entradas.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Total Retiros</p>
          <p className="text-2xl font-black text-red-600">-${retiros.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas Tarjeta</p>
          <p className="text-xl font-black text-delight-dark">${ventasTarjeta.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Transferencias</p>
          <p className="text-xl font-black text-delight-dark">${ventasTransferencia.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">Uber Eats</p>
          <p className="text-xl font-black text-delight-dark">${ventasUber.toFixed(2)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-delight-gray uppercase mb-1">DiDi Food</p>
          <p className="text-xl font-black text-delight-dark">${ventasDidi.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 flex justify-between items-center">
        <div>
          <h3 className="text-amber-900 font-black uppercase text-xl">Efectivo Esperado en Caja</h3>
          <p className="text-amber-700 text-sm">Fondo + Ventas Efectivo + Entradas - Retiros</p>
        </div>
        <div className="text-4xl font-black text-amber-600">
          ${expectedCash.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-delight-dark uppercase tracking-wider mb-4">Registrar Movimiento</h3>
          <form onSubmit={handleAddMovement} className="space-y-4">
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="IN" checked={movementType === 'IN'} onChange={() => setMovementType('IN')} className="peer sr-only" />
                <div className="p-3 text-center rounded-xl border-2 peer-checked:border-green-500 peer-checked:bg-green-50 font-bold text-sm">Entrada (+)</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="OUT" checked={movementType === 'OUT'} onChange={() => setMovementType('OUT')} className="peer sr-only" />
                <div className="p-3 text-center rounded-xl border-2 peer-checked:border-red-500 peer-checked:bg-red-50 font-bold text-sm">Retiro (-)</div>
              </label>
            </div>
            <input type="number" step="0.01" min="0" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Cantidad $" className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
            <input type="text" required value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motivo" className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
            <button type="submit" className="w-full py-3 bg-delight-dark text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-delight-dark-hover transition-colors">
              Guardar Movimiento
            </button>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full max-h-80 overflow-y-auto">
          <h3 className="text-lg font-black text-delight-dark uppercase tracking-wider mb-4">Historial de Movimientos</h3>
          <div className="space-y-3">
            {movements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay movimientos registrados</p>
            ) : (
              movements.map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {m.type === 'IN' ? <ArrowDownToLine className="w-5 h-5 text-green-500" /> : <ArrowUpFromLine className="w-5 h-5 text-red-500" />}
                    <div>
                      <p className="text-sm font-bold text-gray-900">{m.reason}</p>
                      <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleTimeString()} • {m.user}</p>
                    </div>
                  </div>
                  <p className={`font-black ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'IN' ? '+' : '-'}${m.amount.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
