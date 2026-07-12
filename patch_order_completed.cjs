const fs = require('fs');
let code = fs.readFileSync('src/contexts/OrderContext.tsx', 'utf8');

code = code.replace(
  /import \{ saveProductToSupabase \} from '\.\.\/lib\/supabaseService';/,
  "import { saveProductToSupabase, saveOrderToSupabase } from '../lib/supabaseService';"
);

code = code.replace(
  /const orderCompleted = async \(newOrder: Order, currentUser: any, customers: any, setCustomers: any\) => \{/,
  `const orderCompleted = async (newOrder: Order, currentUser: any, customers: any, setCustomers: any) => {
    // Ensure Supabase succeeds before updating any local state
    await saveOrderToSupabase(newOrder, currentUser?.id || '');
`
);

code = code.replace(
  /await orderService\.completeOrder\(newOrder, currentUser\?\.id \|\| '', registerSyncAction\);/,
  `// saveCachedOrder
    import { saveCachedOrder } from '../lib/indexedDB';
    await saveCachedOrder(newOrder);`
);

fs.writeFileSync('src/contexts/OrderContext.tsx', code);
