const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

code = code.replace(
  /\| 'users' \| 'audit' \| 'alertas' \| 'corte' \| 'ticket_error' \| 'produccion' \| 'importador'>\('metrics'\);/,
  ""
);

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
