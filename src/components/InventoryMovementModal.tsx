import React, { useState } from 'react';
import { X, Save, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Ingredient } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useUserContext } from '../contexts/UserContext';

export default function InventoryMovementModal({ 
  ingredients, 
  onClose, 
  onSave 
}: { 
  ingredients: Ingredient[], 
  onClose: () => void, 
  onSave: (ingredientId: string, quantity: number, type: 'IN' | 'OUT' | 'ADJUST') => void 
}) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [ingredientId, setIngredientId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [provider, setProvider] = useState('');
  const [invoice, setInvoice] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useUserContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientId || !quantity) return;
    
    setLoading(true);
    const qty = parseFloat(quantity);
    
    if (isSupabaseConfigured) {
      const { error } = await supabase!.from('inventory_movements').insert({
        ingredient_id: ingredientId,
        type,
        quantity: qty,
        unit_cost: cost ? parseFloat(cost) : null,
        total_cost: cost && quantity ? parseFloat(cost) * qty : null,
        provider: provider || null,
        invoice_number: invoice || null,
        notes: notes || null,
        user_id: currentUser?.id || 'unknown'
      });
      if (error) console.error("Error saving inventory movement:", error);
    }
    
    onSave(ingredientId, type === 'OUT' ? -qty : qty, type); // Adjusts the stock
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 shrink-0">
          <h2 className="text-xl font-black text-delight-dark uppercase tracking-tight flex items-center gap-2">
            {type === 'IN' && <ArrowDownToLine className="w-5 h-5 text-green-500" />}
            {type === 'OUT' && <ArrowUpFromLine className="w-5 h-5 text-red-500" />}
            {type === 'ADJUST' && <span className="w-5 h-5 flex items-center justify-center text-blue-500">~</span>}
            Movimiento de Inventario
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="inv-movement-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="IN" checked={type === 'IN'} onChange={() => setType('IN')} className="peer sr-only" />
                <div className="p-3 text-center rounded-xl border-2 peer-checked:border-green-500 peer-checked:bg-green-50 font-bold text-sm">Entrada (Compra)</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="OUT" checked={type === 'OUT'} onChange={() => setType('OUT')} className="peer sr-only" />
                <div className="p-3 text-center rounded-xl border-2 peer-checked:border-red-500 peer-checked:bg-red-50 font-bold text-sm">Salida (Merma)</div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="type" value="ADJUST" checked={type === 'ADJUST'} onChange={() => setType('ADJUST')} className="peer sr-only" />
                <div className="p-3 text-center rounded-xl border-2 peer-checked:border-blue-500 peer-checked:bg-blue-50 font-bold text-sm">Ajuste</div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ingrediente / Insumo *</label>
              <select required value={ingredientId} onChange={e => setIngredientId(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none">
                <option value="">Seleccione insumo...</option>
                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit}) - Stock: {i.stock}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad *</label>
                <input type="number" step="0.001" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Unitario ($)</label>
                <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
              </div>
            </div>

            {type === 'IN' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                  <input type="text" value={provider} onChange={e => setProvider(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Folio / Factura</label>
                  <input type="text" value={invoice} onChange={e => setInvoice(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observaciones</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 bg-gray-50 border-2 rounded-xl focus:border-delight-green outline-none" />
            </div>

          </form>
        </div>
        <div className="p-6 border-t bg-gray-50 shrink-0">
          <button form="inv-movement-form" type="submit" disabled={loading} className="w-full py-4 bg-delight-green text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-delight-green-hover transition-colors flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Guardar Movimiento'}
          </button>
        </div>
      </div>
    </div>
  );
}
