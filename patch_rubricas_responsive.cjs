const fs = require('fs');
let code = fs.readFileSync('src/components/RubricasGerencialesView.tsx', 'utf8');

code = code.replace(
  /<div className="grid grid-cols-12/g,
  '<div className="flex flex-col lg:grid lg:grid-cols-12'
);

code = code.replace(
  /className="col-span-8/g,
  'className="col-span-1 lg:col-span-8'
);

code = code.replace(
  /className="col-span-4/g,
  'className="col-span-1 lg:col-span-4'
);

code = code.replace(
  /className="col-span-9/g,
  'className="col-span-1 lg:col-span-9'
);

code = code.replace(
  /className="col-span-3/g,
  'className="col-span-1 lg:col-span-3'
);

code = code.replace(
  /className="col-span-7/g,
  'className="col-span-1 lg:col-span-7'
);

code = code.replace(
  /className="col-span-5/g,
  'className="col-span-1 lg:col-span-5'
);

code = code.replace(
  /className="col-span-6/g,
  'className="col-span-1 lg:col-span-6'
);

fs.writeFileSync('src/components/RubricasGerencialesView.tsx', code);
