const fs = require('fs');
let code = fs.readFileSync('src/components/KdsView.tsx', 'utf8');

const oldExtras = `{/* Extras details */}
                            {item.extras.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.extras.map((extra, exIdx) => (
                                  <span key={exIdx} className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded uppercase">
                                    + {extra}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Cubiertos selection */}`;

const newExtras = `{/* Extras details */}
                            {item.extras.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.extras.map((extra, exIdx) => (
                                  <span key={exIdx} className="text-[9px] font-bold text-delight-dark bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded uppercase">
                                    + {extra}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Kitchen Notes */}
                            {item.kitchenNotes && (
                              <div className="mt-2 bg-yellow-100 border-l-4 border-yellow-500 p-2 rounded-r flex gap-2 items-start">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] font-black text-yellow-900 uppercase">
                                  {item.kitchenNotes}
                                </span>
                              </div>
                            )}
                            {/* Cubiertos selection */}`;

code = code.replace(oldExtras, newExtras);
fs.writeFileSync('src/components/KdsView.tsx', code);
