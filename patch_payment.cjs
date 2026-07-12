const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

const oldPaymentButtons = `            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="checkout-cash-btn"
                disabled={cart.length === 0}
                onClick={() => handleFinalizeOrder('efectivo')}
                className="bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-3.5 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>💵 Efectivo</span>
              </button>
              <button
                type="button"
                id="checkout-card-btn"
                disabled={cart.length === 0}
                onClick={() => handleFinalizeOrder('tarjeta')}
                className="bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-3.5 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>💳 Tarjeta</span>
              </button>
              <button
                type="button"
                id="checkout-wire-btn"
                disabled={cart.length === 0}
                onClick={() => handleFinalizeOrder('transferencia')}
                className="bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-black py-3.5 rounded-xl shadow-md shadow-delight-green/10 text-xs hover:shadow-lg hover:shadow-delight-green/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>⚡ Transferencia</span>
              </button>
            </div>`;

const newPaymentButtons = `            <div className="grid grid-cols-3 gap-2">
              {['MOSTRADOR', 'ESPECIAL', 'ONLINE_FUTURE'].includes(activeChannel) && (
                <>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('efectivo')}
                    className="bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-3.5 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>💵 Efectivo</span>
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('tarjeta')}
                    className="bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-3.5 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>💳 Tarjeta</span>
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('transferencia')}
                    className="bg-gradient-to-r from-delight-green to-delight-green-hover text-white font-black py-3.5 rounded-xl shadow-md shadow-delight-green/10 text-xs hover:shadow-lg hover:shadow-delight-green/20 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>⚡ Transferencia</span>
                  </button>
                </>
              )}
              {activeChannel === 'UBER' && (
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => handleFinalizeOrder('plataforma')}
                  className="col-span-3 bg-[#06C167] text-white font-black py-4 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>📱 Pagar en Plataforma Uber Eats</span>
                </button>
              )}
              {activeChannel === 'DIDI' && (
                <>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('plataforma')}
                    className="col-span-2 bg-[#F96D00] text-white font-black py-4 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>📱 Plataforma DiDi</span>
                  </button>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleFinalizeOrder('efectivo')}
                    className="col-span-1 bg-white border border-delight-gray/15 text-delight-dark font-extrabold py-4 rounded-xl shadow-sm text-xs hover:bg-delight-dark/5 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>💵 Efectivo</span>
                  </button>
                </>
              )}
            </div>`;

code = code.replace(oldPaymentButtons, newPaymentButtons);
fs.writeFileSync('src/components/POSView.tsx', code);
