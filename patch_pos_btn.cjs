const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');
code = code.replace(
  /<span>\\\$\{\(cart\.reduce[^\}]+\}\}<\/span>/,
  "<span>${(posMode === 'canje' ? 0 : cartTotal).toFixed(2)}</span>"
);
fs.writeFileSync('src/components/POSView.tsx', code);
