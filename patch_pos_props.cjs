const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

code = code.replace(
  /onOrderCompleted: \(order: Order\) => void;/,
  "onOrderCompleted: (order: Order) => Promise<void> | void;"
);

fs.writeFileSync('src/components/POSView.tsx', code);
