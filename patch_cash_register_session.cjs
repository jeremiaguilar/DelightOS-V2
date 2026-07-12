const fs = require('fs');
let code = fs.readFileSync('src/contexts/CashRegisterContext.tsx', 'utf8');

code = code.replace(
  '  closingNotes?: string;\n}',
  `  closingNotes?: string;
  ventasEfectivo?: number;
  ventasTarjeta?: number;
  ventasTransferencia?: number;
  ventasUberPlataforma?: number;
  ventasDidiPlataforma?: number;
  ventasDidiEfectivo?: number;
  canjesCount?: number;
  canceladosCount?: number;
}`
);

fs.writeFileSync('src/contexts/CashRegisterContext.tsx', code);
