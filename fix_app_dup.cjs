const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /type="button"\n\s+id="nav-rubricas"\n\s+type="button"/,
  'type="button"'
);

fs.writeFileSync('src/App.tsx', code);
