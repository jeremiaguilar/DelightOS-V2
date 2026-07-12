const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /\{currentUser\.role !== 'cocina' && !activeRegister && !isRegisterLoading && \(\n\s+<CashRegisterModal onOpen=\{openRegister\} \/>\n\s+\)\}/g,
  ''
);

fs.writeFileSync('src/App.tsx', code);
