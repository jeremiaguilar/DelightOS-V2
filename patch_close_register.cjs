const fs = require('fs');
let code = fs.readFileSync('src/contexts/CashRegisterContext.tsx', 'utf8');

code = code.replace(
  'closeRegister: (countedCash: number, expectedCash: number, difference: number, notes: string) => Promise<void>;',
  'closeRegister: (metrics: any) => Promise<void>;'
);

code = code.replace(
  'const closeRegister = async (countedCash: number, expectedCash: number, difference: number, notes: string) => {',
  'const closeRegister = async (metrics: any) => {'
);

code = code.replace(
  '      expectedCash,\n      countedCash,\n      difference,\n      closingNotes: notes',
  '      expectedCash: metrics.expectedCash,\n      countedCash: metrics.countedCash,\n      difference: metrics.difference,\n      closingNotes: metrics.notes,\n      ventasEfectivo: metrics.ventasEfectivo,\n      ventasTarjeta: metrics.ventasTarjeta,\n      ventasTransferencia: metrics.ventasTransferencia,\n      ventasUberPlataforma: metrics.ventasUberPlataforma,\n      ventasDidiPlataforma: metrics.ventasDidiPlataforma,\n      ventasDidiEfectivo: metrics.ventasDidiEfectivo,\n      canjesCount: metrics.canjesCount,\n      canceladosCount: metrics.canceladosCount'
);

code = code.replace(
  'expected_cash: closedRegister.expectedCash,\n        counted_cash: closedRegister.countedCash,\n        difference: closedRegister.difference,\n        closing_notes: closedRegister.closingNotes',
  `expected_cash: closedRegister.expectedCash,
        counted_cash: closedRegister.countedCash,
        difference: closedRegister.difference,
        closing_notes: closedRegister.closingNotes,
        metrics: {
          ventasEfectivo: closedRegister.ventasEfectivo,
          ventasTarjeta: closedRegister.ventasTarjeta,
          ventasTransferencia: closedRegister.ventasTransferencia,
          ventasUberPlataforma: closedRegister.ventasUberPlataforma,
          ventasDidiPlataforma: closedRegister.ventasDidiPlataforma,
          ventasDidiEfectivo: closedRegister.ventasDidiEfectivo,
          canjesCount: closedRegister.canjesCount,
          canceladosCount: closedRegister.canceladosCount
        }`
);

code = code.replace(
  '`Efectivo Contado: $${countedCash} (Dif: $${difference})`,',
  '`Efectivo Contado: $${metrics.countedCash} (Dif: $${metrics.difference})`,'
);

fs.writeFileSync('src/contexts/CashRegisterContext.tsx', code);
