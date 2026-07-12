const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

const oldHeader = `        {/* Top filter and Search Bar iPad-Style */}
        <div className="flex justify-between items-center gap-4 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-delight-gray/50 w-5 h-5" />
            <input
              type="text"
              id="product-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-delight-gray/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold outline-none focus:border-delight-green/40 focus:ring-4 focus:ring-delight-green/5 transition-all shadow-sm"
              placeholder={(posMode === 'canje') ? "Buscar premio..." : "Buscar maki, frappé, bebida..."}
            />
          </div>

          {/* Mode Switcher Canje/Venta */}
          <button
            type="button"
            id="toggle-canje-mode"
            onClick={() => {
              );
              setCart([]); // Clear cart to avoid mismatch
            }}
            className={\`py-3.5 px-6 rounded-2xl font-bold flex items-center gap-2 text-sm shadow-sm transition-all border cursor-pointer \${
              (posMode === 'canje') 
                ? 'bg-delight-yellow text-white border-delight-yellow hover:bg-delight-yellow-hover shadow-delight-yellow/15'
                : 'bg-white text-delight-gray border-delight-gray/10 hover:bg-delight-dark/5'
            }\`}
          >
            <Gift className="w-5 h-5" />
            {(posMode === 'canje') ? 'Canje de Premios Activo' : 'Venta Regular'}
          </button>
        </div>`;

const newHeader = `        {/* Mode Selector Tabs */}
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-delight-gray/10 mb-4 shrink-0">
          <button
            onClick={() => { setPosMode('venta'); setCart([]); }}
            className={\`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors \${posMode === 'venta' ? 'bg-delight-green text-white shadow-md' : 'text-delight-gray hover:text-delight-dark'}\`}
          >
            Nueva Venta
          </button>
          <button
            onClick={() => { setPosMode('canje'); setCart([]); }}
            className={\`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors \${posMode === 'canje' ? 'bg-delight-yellow text-white shadow-md' : 'text-delight-gray hover:text-delight-dark'}\`}
          >
            Canje de Puntos
          </button>
          <button
            onClick={() => { setPosMode('error'); setCart([]); }}
            className={\`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors \${posMode === 'error' ? 'bg-red-500 text-white shadow-md' : 'text-delight-gray hover:text-delight-dark'}\`}
          >
            Ticket con Error
          </button>
        </div>

        {posMode !== 'error' && (
          <div className="flex justify-between items-center gap-4 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-delight-gray/50 w-5 h-5" />
              <input
                type="text"
                id="product-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-delight-gray/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold outline-none focus:border-delight-green/40 focus:ring-4 focus:ring-delight-green/5 transition-all shadow-sm"
                placeholder={posMode === 'canje' ? "Buscar premio..." : "Buscar maki, frappé, bebida..."}
              />
            </div>
          </div>
        )}`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/components/POSView.tsx', code);
