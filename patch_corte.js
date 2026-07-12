const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

// Replace the hook usage
code = code.replace(
  "  const { currentUser, updateUsers } = useUserContext();",
  "  const { currentUser, updateUsers } = useUserContext();\n  const { activeRegister, openRegister, closeRegister, history } = useCashRegisterContext();"
);

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
