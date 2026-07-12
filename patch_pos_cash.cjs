const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

const importStatement = `import { useCashRegisterContext } from '../contexts/CashRegisterContext';
import CashRegisterModal from './CashRegisterModal';\n`;

code = code.replace(
  /export default function POSView\(\{ customers, ingredients, currentUser, onOrderCompleted, rewards, products \}: POSViewProps\) \{/,
  importStatement + "export default function POSView({ customers, ingredients, currentUser, onOrderCompleted, rewards, products }: POSViewProps) {\n  const { activeRegister, openRegister, isLoading: isRegisterLoading } = useCashRegisterContext();\n\n  if (!activeRegister && !isRegisterLoading) {\n    return <div className=\"w-full h-full\"><CashRegisterModal onOpen={openRegister} /></div>;\n  }"
);

fs.writeFileSync('src/components/POSView.tsx', code);
