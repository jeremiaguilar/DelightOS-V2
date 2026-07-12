const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /ShieldAlert\n  Wallet,/,
  "ShieldAlert,\n  Wallet,"
);

fs.writeFileSync('src/App.tsx', code);
