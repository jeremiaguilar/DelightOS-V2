const fs = require('fs');
let code = fs.readFileSync('src/contexts/OrderContext.tsx', 'utf8');

code = code.replace(
  /await saveCachedProduct\(newOrder as any\); \/\/ save to db is handled inside service, save order to cache:/,
  ''
);

fs.writeFileSync('src/contexts/OrderContext.tsx', code);
