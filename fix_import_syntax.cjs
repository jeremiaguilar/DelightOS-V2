const fs = require('fs');
let code = fs.readFileSync('src/contexts/OrderContext.tsx', 'utf8');

code = code.replace(
  /\/\/ saveCachedOrder\n\s+import \{ saveCachedOrder \} from '\.\.\/lib\/indexedDB';/,
  ''
);

// Add it to top level
code = code.replace(
  /import \{ loadCachedProducts, saveCachedProduct \} from '\.\.\/lib\/indexedDB';/,
  "import { loadCachedProducts, saveCachedProduct, saveCachedOrder } from '../lib/indexedDB';"
);

fs.writeFileSync('src/contexts/OrderContext.tsx', code);
