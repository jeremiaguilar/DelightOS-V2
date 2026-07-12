const fs = require('fs');
let code = fs.readFileSync('src/lib/supabaseService.ts', 'utf8');

code = code.replace(
  /  } catch \(error\) \{\n\s+console\.warn\('Error saving order transaction to Supabase:', error\);\n\s+\}/,
  `  } catch (error) {\n    console.error('Error saving order transaction to Supabase:', error);\n    throw error;\n  }`
);

fs.writeFileSync('src/lib/supabaseService.ts', code);
