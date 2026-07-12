const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

const oldModalFooter = `            {/* Summary details inside Modal */}
            <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-delight-gray/5 flex justify-between items-center text-xs">
              <span className="font-bold text-delight-gray">Total por {editingItem.quantity} unidades:</span>
              <span className="font-black text-sm text-delight-dark">\${posMode === 'canje' ? '0.00' : editingItem.subtotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              id="confirm-modifiers-btn"
              onClick={() => setEditingItem(null)}
              className="w-full py-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Selección
            </button>`;

const newModalFooter = `            {/* Kitchen Notes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-delight-gray uppercase tracking-widest">Observaciones Cocina</span>
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">No sale en ticket</span>
              </div>
              <textarea
                value={editingItem.kitchenNotes || ''}
                onChange={(e) => {
                  const updated = { ...editingItem, kitchenNotes: e.target.value };
                  setEditingItem(updated);
                  setCart(cart.map(c => c.id === updated.id ? updated : c));
                }}
                className="w-full bg-gray-50 border border-delight-gray/10 rounded-xl px-4 py-3 font-semibold outline-none focus:border-delight-green/40 h-20 resize-none"
                placeholder="Ej. Sin pepino, salsa aparte..."
              />
            </div>

            {/* Summary details inside Modal */}
            <div className="bg-[#FFFDF8] p-4 rounded-2xl border border-delight-gray/5 flex justify-between items-center text-xs">
              <span className="font-bold text-delight-gray">Total por {editingItem.quantity} unidades:</span>
              <span className="font-black text-sm text-delight-dark">\${posMode === 'canje' ? '0.00' : editingItem.subtotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              id="confirm-modifiers-btn"
              onClick={() => setEditingItem(null)}
              className="w-full py-4 bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-extrabold rounded-2xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Selección
            </button>`;

code = code.replace(oldModalFooter, newModalFooter);
fs.writeFileSync('src/components/POSView.tsx', code);
