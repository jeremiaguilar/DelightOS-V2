const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /} from 'lucide-react';/,
  "  Wallet,\n} from 'lucide-react';"
);

code = code.replace(
  /import CashRegisterModal from '\.\/components\/CashRegisterModal';/,
  "import CashRegisterModal from './components/CashRegisterModal';\nimport CashRegisterView from './components/CashRegisterView';"
);

code = code.replace(
  /\{activeTab === 'club' && <ClubDelightView \/>\}/,
  "{activeTab === 'club' && <ClubDelightView />}\n          {activeTab === 'caja' && <CashRegisterView />}"
);

fs.writeFileSync('src/App.tsx', code);
