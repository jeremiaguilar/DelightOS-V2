import React, { useState } from 'react';
import { Coins, AlertTriangle } from 'lucide-react';
import { useUserContext } from '../contexts/UserContext';

interface CashRegisterModalProps {
  onOpen: (float: number, branch: string, notes: string) => Promise<void>;
}

export default function CashRegisterModal({ onOpen }: CashRegisterModalProps) {
  const { currentUser } = useUserContext();
  const [float, setFloat] = useState<string>('500');
  const [branch, setBranch] = useState<string>('Sucursal Principal');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const floatAmount = parseFloat(float);
    if (isNaN(floatAmount) || floatAmount < 0) {
      alert("Ingrese un monto válido para el fondo inicial.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onOpen(floatAmount, branch, notes);
    } catch (e) {
      console.error(e);
      alert("Error al abrir la caja");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-900 uppercase tracking-tight">Apertura Requerida</h2>
            <p className="text-sm text-amber-700/80 mt-0.5 leading-tight">Debes iniciar una sesión de caja antes de operar el sistema.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-delight-gray uppercase tracking-wider mb-2">
              Fondo Inicial (Efectivo)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-delight-gray font-bold">$</span>
              <input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={float}
                onChange={e => setFloat(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-delight-gray/10 rounded-xl focus:outline-none focus:border-delight-green font-bold text-delight-dark transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-delight-gray uppercase tracking-wider mb-2">
              Responsable
            </label>
            <input 
              type="text" 
              value={currentUser?.name || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border-2 border-transparent rounded-xl font-bold text-delight-gray cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-delight-gray uppercase tracking-wider mb-2">
              Sucursal
            </label>
            <input 
              type="text" 
              required
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-delight-gray/10 rounded-xl focus:outline-none focus:border-delight-green font-medium text-delight-dark transition-colors"
              placeholder="Nombre de sucursal"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-delight-gray uppercase tracking-wider mb-2">
              Observaciones (Opcional)
            </label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-delight-gray/10 rounded-xl focus:outline-none focus:border-delight-green font-medium text-delight-dark transition-colors resize-none h-20"
              placeholder="Ej: Faltan monedas de $5"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-delight-green text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-delight-green-hover transition-colors shadow-lg shadow-delight-green/20 flex items-center justify-center gap-2 mt-4"
          >
            <Coins className="w-5 h-5" />
            {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
          </button>
        </form>
      </div>
    </div>
  );
}
