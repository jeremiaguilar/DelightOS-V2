const fs = require('fs');
let code = fs.readFileSync('src/components/POSView.tsx', 'utf8');

code = code.replace(
  '        </div>\n      </div>\n\n      {/* Cart & Billing Section',
  '        </div>\n      </>\n      )}\n      </div>\n\n      {/* Cart & Billing Section'
);

fs.writeFileSync('src/components/POSView.tsx', code);
