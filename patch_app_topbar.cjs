const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const topBar = `
      <div className="bg-delight-dark text-white py-1 px-4 text-[10px] flex justify-between items-center hidden md:flex font-mono z-40 relative">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-delight-green"/> {currentUser.name} ({currentUser.role})</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-delight-yellow"/> {systemConfig?.ticket?.businessName || 'Sucursal Principal'}</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 font-bold uppercase">{activeRegister ? <span className="text-green-400">● Caja Abierta</span> : <span className="text-red-400">● Caja Cerrada</span>}</span>
          <span className="flex items-center gap-1.5 font-bold uppercase">{isSupabaseConfigured ? <span className="text-blue-400">● Nube Activa</span> : <span className="text-amber-400">● Local Mode</span>}</span>
          <span>{renderSyncIndicator()}</span>
        </div>
      </div>
      <header className="h-16 bg-white border-b border-delight-gray/10 flex justify-between items-center px-4 md:px-6 shrink-0 shadow-sm z-30 relative">`;

code = code.replace(/<header className="h-16 bg-white border-b border-delight-gray\/10 flex justify-between items-center px-4 md:px-6 shrink-0 shadow-sm z-30 relative">/, topBar);

fs.writeFileSync('src/App.tsx', code);
