const fs = require('fs');
let code = fs.readFileSync('src/components/TicketModal.tsx', 'utf8');

const itemsRenderOld = `{/* Items Table */}
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
                        \${isCanje ? '0.00' : item.subtotal.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Modifiers (Extras) */}
                    {item.extras.map((extra, idx) => (
                      <div key={idx} className="grid grid-cols-12 text-[10px] text-gray-500 pl-3">
                        <div className="col-span-1">+</div>
                        <div className="col-span-8">{extra}</div>
                        <div className="col-span-3 text-right">
                          \${isCanje ? '0.00' : item.extrasCost.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {item.selectedCubierto !== 'Ninguno' && (
                      <div className="grid grid-cols-12 text-[10px] text-gray-500 pl-3">
                        <div className="col-span-1">+</div>
                        <div className="col-span-8">Cubierto: {item.selectedCubierto}</div>
                        <div className="col-span-3 text-right">
                          \${isCanje ? '0.00' : item.cubiertosCost.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>`;

const itemsRenderNew = `{/* Items Table */}
            <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
              {ticketView === 'cliente' ? (
                <>
                  <div className="grid grid-cols-12 font-bold mb-1 border-b border-dotted border-gray-300 pb-0.5">
                    <div className="col-span-2">CANT</div>
                    <div className="col-span-7">PRODUCTO</div>
                    <div className="col-span-3 text-right">TOTAL</div>
                  </div>
                  <div className="space-y-1.5">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <div className="grid grid-cols-12 items-start">
                          <div className="col-span-2 font-bold text-center">{item.quantity}</div>
                          <div className="col-span-7 font-bold leading-tight">{item.name}</div>
                          <div className="col-span-3 text-right font-bold">
                            \${isCanje ? '0.00' : item.subtotal.toFixed(2)}
                          </div>
                        </div>
                        
                        {/* Modifiers (Extras) */}
                        {item.extras.map((extra, idx) => (
                          <div key={idx} className="grid grid-cols-12 text-[10px] text-gray-500 pl-3">
                            <div className="col-span-2"></div>
                            <div className="col-span-7 leading-tight">{extra}</div>
                            <div className="col-span-3 text-right">
                              \${isCanje ? '0.00' : item.extrasCost.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center font-bold mb-2 uppercase border-b border-dotted border-gray-300 pb-1">TICKET INTERNO / COCINA</div>
                  <div className="space-y-3 mt-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="border-b border-gray-200 pb-2 mb-2">
                        <div className="font-bold text-[11px] uppercase mb-1">
                          {item.quantity} {item.name}
                        </div>
                        
                        {/* Checklist options */}
                        {item.extras.length > 0 && (
                          <div className="pl-2 space-y-1 mb-1.5">
                            {item.extras.map((extra, idx) => (
                              <div key={idx} className="text-[10px] uppercase font-bold flex items-center gap-1.5">
                                <div className="w-3 h-3 border border-black rounded-sm shrink-0"></div>
                                {extra}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.selectedCubierto !== 'Ninguno' && (
                          <div className="pl-2 text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1.5">
                            <div className="w-3 h-3 border border-black rounded-sm shrink-0"></div>
                            {item.selectedCubierto}
                          </div>
                        )}
                        
                        {/* Kitchen Notes */}
                        {item.kitchenNotes && (
                          <div className="mt-1.5 border border-black p-1.5 text-[10px] font-bold uppercase leading-tight bg-gray-100">
                            OBSERVACIONES:<br/>
                            {item.kitchenNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>`;

code = code.replace(itemsRenderOld, itemsRenderNew);
fs.writeFileSync('src/components/TicketModal.tsx', code);
