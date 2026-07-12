const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '    </div>\n  );\n}',
  `      {currentUser.role !== 'cocina' && !activeRegister && !isRegisterLoading && (
        <CashRegisterModal onOpen={openRegister} />
      )}
    </div>
  );
}`
);
fs.writeFileSync('src/App.tsx', code);
