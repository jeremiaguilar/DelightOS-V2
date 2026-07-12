const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '<OrderProvider>',
  '<CashRegisterProvider>\n                <OrderProvider>'
);
code = code.replace(
  '</OrderProvider>',
  '</OrderProvider>\n              </CashRegisterProvider>'
);
fs.writeFileSync('src/App.tsx', code);
