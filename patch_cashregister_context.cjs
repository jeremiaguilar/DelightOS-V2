const fs = require('fs');
let code = fs.readFileSync('src/contexts/CashRegisterContext.tsx', 'utf8');

code = code.replace(
  /export interface CashRegisterSession \{/,
  "export interface CashRegisterSession {\n  movements?: any[];"
);

code = code.replace(
  /const newHistory = history\.map\(r => r\.id === closedRegister\.id \? closedRegister : r\);/,
  "const newHistory = history.map(r => r.id === closedRegister.id ? closedRegister : r);"
);

// We need to implement a sync mechanism. But `SyncService` is already doing background sync for many things.
// I will just make sure to add `addMovement` to `CashRegisterContext` since we used it in `CashRegisterView` but I implemented it locally there.

fs.writeFileSync('src/contexts/CashRegisterContext.tsx', code);
