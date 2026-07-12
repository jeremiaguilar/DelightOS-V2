const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

const originalBtn = `<button
              type="button"
              id="search-customer-btn"
              onClick={() => setShowCustomerSearch(true)}
              className="w-full py-3.5 px-4 bg-white border border-dashed border-delight-green/30 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-delight-green hover:bg-delight-green/5 transition-all cursor-pointer"
            >
              <UserPlus className="w-4.5 h-4.5" />
              Vincular Club DELIGHT
            </button>`;

const newBtns = `<div className="flex gap-2">
            <button
              type="button"
              id="search-customer-btn"
              onClick={() => setShowCustomerSearch(true)}
              className="flex-1 py-3.5 px-2 bg-white border border-dashed border-delight-green/30 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-delight-green hover:bg-delight-green/5 transition-all cursor-pointer uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" />
              Vincular Cliente
            </button>
            <button
              type="button"
              onClick={() => {
                 const id = prompt("Simulador Escáner: Ingrese ID del cliente contenido en el QR (ej. DL-1001)");
                 if (!id) return;
                 const c = customers.find(c => c.id.toLowerCase() === id.toLowerCase() || c.qrCode.toLowerCase() === id.toLowerCase());
                 if (c) {
                   setLinkedCustomer(c);
                 } else {
                   alert("QR Inválido o Cliente no encontrado.");
                 }
              }}
              className="flex-1 py-3.5 px-2 bg-blue-50 border border-dashed border-blue-300 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-blue-600 hover:bg-blue-100 transition-all cursor-pointer uppercase tracking-wider"
            >
              <QrCode className="w-4 h-4" />
              Escanear QR
            </button>
          </div>`;

code = code.replace(originalBtn, newBtns);
fs.writeFileSync('src/components/POSView.tsx', code);
