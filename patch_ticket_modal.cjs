const fs = require('fs');
let code = fs.readFileSync('src/components/TicketModal.tsx', 'utf8');

// Add state for active tab
code = code.replace(
  'const { currentUser } = useUserContext();',
  'const { currentUser } = useUserContext();\n  const [ticketView, setTicketView] = useState<\'cliente\' | \'cocina\'>(\'cliente\');'
);

// Add toggle buttons at the top of the modal
const headerReplace = `<div className="flex justify-between items-center bg-[#FFFDF8] border-b border-delight-gray/10 p-5 shrink-0">
          <h3 className="font-black text-delight-dark uppercase tracking-wider text-sm flex items-center gap-2">
            <Receipt className="w-5 h-5 text-delight-gray" />
            Ticket #{order.ticketNumber}
          </h3>`;

const headerReplacement = `<div className="flex justify-between items-center bg-[#FFFDF8] border-b border-delight-gray/10 p-5 shrink-0">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-delight-dark uppercase tracking-wider text-sm flex items-center gap-2">
              <Receipt className="w-5 h-5 text-delight-gray" />
              Ticket #{order.ticketNumber}
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTicketView('cliente')}
                className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${ticketView === 'cliente' ? 'bg-white text-delight-dark shadow-sm' : 'text-delight-gray'}\`}
              >
                Cliente
              </button>
              <button
                onClick={() => setTicketView('cocina')}
                className={\`px-3 py-1 text-xs font-bold rounded-md transition-colors \${ticketView === 'cocina' ? 'bg-white text-delight-dark shadow-sm' : 'text-delight-gray'}\`}
              >
                Cocina
              </button>
            </div>
          </div>`;

code = code.replace(headerReplace, headerReplacement);

fs.writeFileSync('src/components/TicketModal.tsx', code);
