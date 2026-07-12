const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

code = code.replace(
  /const updated = history\.map\(c => \{\s+if \(c\.id === corteId\) \{\s+return \{ \.\.\.c, status: 'revisado', revisor: currentUser\.name \};\s+\}\s+return c;\s+\}\);\s+setCutsList\(updated\);\s+localStorage\.setItem\('delight_cash_cuts', JSON\.stringify\(updated\)\);/m,
  "updateHistoryRecord(corteId, { status: 'revisado', revisor: currentUser.name });"
);

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
