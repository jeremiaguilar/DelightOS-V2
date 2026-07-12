const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

// we'll inject the logic for dashboard right after the states

const newLogic = `
  // Dashboard Logic
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);
  
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today) && o.status !== 'cancelado');
  const monthOrders = orders.filter(o => o.createdAt.startsWith(month) && o.status !== 'cancelado');
  
  const ventasHoy = todayOrders.reduce((acc, o) => acc + o.total, 0);
  const ventasMes = monthOrders.reduce((acc, o) => acc + o.total, 0);
  
  const ventasUber = todayOrders.filter(o => o.channel === 'UBER').reduce((acc, o) => acc + o.total, 0);
  const ventasDidi = todayOrders.filter(o => o.channel === 'DIDI').reduce((acc, o) => acc + o.total, 0);
  const ventasMostrador = todayOrders.filter(o => o.channel === 'MOSTRADOR').reduce((acc, o) => acc + o.total, 0);
  
  const canjesHoy = todayOrders.filter(o => o.type === 'canje').length;
  const puntosOtorgados = todayOrders.reduce((acc, o) => acc + o.pointsGenerated, 0);
  
  // Productos más vendidos hoy
  const productCounts: Record<string, number> = {};
  todayOrders.forEach(o => o.items.forEach(i => {
    productCounts[i.name] = (productCounts[i.name] || 0) + i.quantity;
  }));
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  // Insumos por agotarse
  const lowStock = ingredients.filter(i => i.stock <= i.minStock);
  
  // Clientes Frecuentes
  const topCustomers = [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);
`;

code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<'general' | 'kds' | 'ticket' | 'sounds' | 'users' | 'audit' | 'cash' | 'data' | 'system'>\('general'\);/,
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'general' | 'kds' | 'ticket' | 'sounds' | 'users' | 'audit' | 'cash' | 'data' | 'system'>('dashboard');\n" + newLogic
);

// Add Dashboard button to the sidebar
const dashboardBtn = `
          <button
            onClick={() => setActiveTab('dashboard')}
            className={\`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all \${
              activeTab === 'dashboard' ? 'bg-delight-green text-white shadow-md' : 'text-delight-gray/70 hover:bg-delight-dark/5 hover:text-delight-dark'
            }\`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
`;

code = code.replace(/<nav className="space-y-1 p-2">/, '<nav className="space-y-1 p-2">\n' + dashboardBtn);

// Add Dashboard content
const dashboardContent = `
        {activeTab === 'dashboard' && (
          <div className="p-8 animate-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-black text-delight-dark uppercase tracking-tight">Dashboard de Ventas</h2>
              <p className="text-sm font-medium text-delight-gray/60">Métricas principales del sistema DelightOS</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas Hoy</p>
                <p className="text-2xl font-black text-delight-dark">\${ventasHoy.toFixed(2)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas Mes</p>
                <p className="text-2xl font-black text-delight-dark">\${ventasMes.toFixed(2)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Canjes Hoy</p>
                <p className="text-2xl font-black text-delight-yellow">{canjesHoy}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Puntos Otorgados</p>
                <p className="text-2xl font-black text-delight-green">+{puntosOtorgados}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas Mostrador</p>
                <p className="text-xl font-black text-blue-600">\${ventasMostrador.toFixed(2)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas Uber Eats</p>
                <p className="text-xl font-black text-green-600">\${ventasUber.toFixed(2)}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-delight-gray uppercase mb-1">Ventas DiDi Food</p>
                <p className="text-xl font-black text-orange-600">\${ventasDidi.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-delight-dark uppercase mb-3">Top 5 Productos (Hoy)</h3>
                <ul className="space-y-2">
                  {topProducts.map(([name, qty]) => (
                    <li key={name} className="flex justify-between items-center text-sm font-semibold">
                      <span>{name}</span>
                      <span className="text-delight-green">{qty} und.</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-delight-dark uppercase mb-3">Top 5 Clientes Frecuentes</h3>
                <ul className="space-y-2">
                  {topCustomers.map((c) => (
                    <li key={c.id} className="flex justify-between items-center text-sm font-semibold">
                      <span>{c.name} {c.lastName}</span>
                      <span className="text-delight-yellow">{c.totalPurchases} visitas</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
                <h3 className="text-sm font-black text-red-800 uppercase mb-3">Insumos por Agotarse</h3>
                <ul className="space-y-2">
                  {lowStock.slice(0,5).map((i) => (
                    <li key={i.id} className="flex justify-between items-center text-sm font-semibold text-red-700">
                      <span>{i.name}</span>
                      <span>{i.stock} {i.unit} (Mín: {i.minStock})</span>
                    </li>
                  ))}
                  {lowStock.length === 0 && <li className="text-sm text-red-600/50">Inventario saludable.</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
`;

code = code.replace(
  /\{activeTab === 'general' && \(/,
  dashboardContent + "\n        {activeTab === 'general' && ("
);

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
