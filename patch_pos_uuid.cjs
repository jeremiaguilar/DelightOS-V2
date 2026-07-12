const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

code = code.replace(
  /id: \`ord-\$\{Date\.now\(\)\}\`,/,
  `id: crypto.randomUUID(),`
);

fs.writeFileSync('src/components/POSView.tsx', code);
