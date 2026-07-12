const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /function AppContent\(\) \{/,
  "function AppContent() {\n  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);"
);

fs.writeFileSync('src/App.tsx', code);
