const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<'metrics' \|const \[activeTab, setActiveTab\] = useState<'dashboard' \| 'general' \| 'kds' \| 'ticket' \| 'sounds' \| 'users' \| 'audit' \| 'cash' \| 'data' \| 'system'>\('dashboard'\);/,
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'general' | 'kds' | 'ticket' | 'sounds' | 'users' | 'audit' | 'cash' | 'data' | 'system'>('dashboard');"
);

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
